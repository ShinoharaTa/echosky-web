import { getAgent } from './atp';
import { get } from 'svelte/store';
import { session } from './session';

// リトライ機能付きのAPI呼び出し
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            const isRateLimit = error?.status === 429 || error?.message?.includes('Too Many Requests');
            const isServerError = error?.status >= 500;
            
            if ((isRateLimit || isServerError) && attempt < maxRetries) {
                // 指数バックオフでリトライ
                const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                console.log(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error?.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

// レート制限を考慮した遅延
async function rateLimitDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

// ボード（コミュニティ）は thread.record.board の文字列で表現する設計に合わせる
export type BoardId = string;

export type ThreadRecord = {
    title: string;
    board?: BoardId;  // optional (レキシコン定義に合わせて)
    createdAt: string;
};

export type PostRecord = {
	thread: string; // at-uri of thread
	text: string;
	createdAt: string;
	facets?: Array<{
		index: { byteStart: number; byteEnd: number };
		features: Array<{
			$type: string;
			[key: string]: any;
		}>;
	}>;  // app.bsky.richtext.facet 対応
	refPost?: { uri: string; cid: string } | null;  // com.atproto.repo.strongRef
};

export type ReactionKind = 'like' | 'laugh' | 'sad' | 'angry' | 'star';

export type ReactionRecord = {
    subject: { uri: string; cid: string };  // com.atproto.repo.strongRef
    reaction: ReactionKind;  // enum: like, laugh, sad, angry, star
    createdAt: string;
};

export type BoardInfoRecord = {
    boardId: string;
    name: string;
    description?: string;
    thumbnail?: Blob;
    createdAt: string;
    updatedAt?: string;
};

const COL = {
    thread: 'app.echosky.board.thread',
    post: 'app.echosky.board.post',
    reaction: 'app.echosky.board.reaction',
    boardInfo: 'app.echosky.board.info'
} as const;

// ランダムなボード識別子を生成
function generateBoardId(): string {
    // 8文字のランダムな英数字を生成
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// バリデーション関数
function validateBoardId(boardId: string): boolean {
    // レキシコン仕様: 英数字・ハイフン・アンダースコアのみ、最大50文字
    const pattern = /^[a-zA-Z0-9_-]+$/;
    return pattern.test(boardId) && boardId.length <= 50;
}

function validateThreadTitle(title: string): boolean {
    // レキシコン仕様: 最大200文字
    return title.length <= 200;
}

function validatePostText(text: string): boolean {
    // レキシコン仕様: 最大5000文字
    return text.length <= 5000;
}

function validateBoardName(name: string): boolean {
    // レキシコン仕様: 最大100文字
    return name.length <= 100;
}

// ボード情報レコードとスレッドレコードの両方からボード一覧を取得
export async function listBoards(includeFollows: boolean = true): Promise<BoardId[]> {
    const s = get(session);
    const a = getAgent();
    const boards = new Set<string>();
    
    try {
        // 1. 自分のボード情報レコードを取得（新しいボード）
        try {
            const boardInfoRes = await a.com.atproto.repo.listRecords({ 
                repo: s.did!, 
                collection: COL.boardInfo, 
                limit: 100 
            });
            for (const r of boardInfoRes.data.records) {
                const v = r.value as BoardInfoRecord;
                boards.add(v.boardId);
            }
        } catch (error) {
            console.debug('Failed to fetch board info records:', error);
        }

        // 2. 自分のスレッドレコードからボードを取得（既存のボード）
        try {
            const threadRes = await a.com.atproto.repo.listRecords({ 
                repo: s.did!, 
                collection: COL.thread, 
                limit: 100 
            });
            for (const r of threadRes.data.records) {
                const v = r.value as ThreadRecord;
                if (v.board) {
                    boards.add(v.board);
                }
            }
        } catch (error) {
            console.debug('Failed to fetch thread records:', error);
        }

        // フォロー中のユーザーのボードも取得（現在は無効化）
        // 注意: 現在はパフォーマンス上の理由で無効化されています
        if (includeFollows && false) {
            try {
                const follows = await a.app.bsky.graph.getFollows({ 
                    actor: s.did!, 
                    limit: 25
                });
            
            const batchSize = 5;
            for (let i = 0; i < follows.data.follows.length; i += batchSize) {
                const batch = follows.data.follows.slice(i, i + batchSize);
                await Promise.allSettled(
                    batch.map(async (follow) => {
                        try {
                            // フォローユーザーのボード情報レコード
                            const userBoardInfoRes = await a.com.atproto.repo.listRecords({ 
                                repo: follow.did, 
                                collection: COL.boardInfo, 
                                limit: 10
                            });
                            for (const r of userBoardInfoRes.data.records) {
                                const v = r.value as BoardInfoRecord;
                                boards.add(v.boardId);
                            }

                            // フォローユーザーのスレッドレコード
                            const userThreadRes = await a.com.atproto.repo.listRecords({ 
                                repo: follow.did, 
                                collection: COL.thread, 
                                limit: 10
                            });
                            for (const r of userThreadRes.data.records) {
                                const v = r.value as ThreadRecord;
                                if (v.board) {
                                    boards.add(v.board);
                                }
                            }
                        } catch (error) {
                            console.debug('Failed to fetch records for user:', follow.did, error);
                        }
                    })
                );
            }
            } catch (error) {
                console.debug('Failed to fetch follows:', error);
            }
        }

    } catch (error) {
        console.error('Failed to fetch boards:', error);
    }
    
    return Array.from(boards).sort();
}

export async function listThreads(board?: string, includeFollows: boolean = true) {
	const s = get(session);
	const a = getAgent();
	const allThreads: Array<{ uri: string; cid: string; value: ThreadRecord }> = [];
	
	try {
		// 自分のスレッドを取得
		const myRes = await a.com.atproto.repo.listRecords({
			repo: s.did!,
			collection: COL.thread,
			limit: 100
		});
		
		for (const r of myRes.data.records) {
			const threadValue = r.value as ThreadRecord;
			if (!board || threadValue.board === board) {
				allThreads.push({ uri: r.uri, cid: r.cid, value: threadValue });
			}
		}

		// フォロー中のユーザーのスレッドも取得
		if (includeFollows) {
			try {
				const follows = await a.app.bsky.graph.getFollows({ 
					actor: s.did!, 
					limit: 25  // limit を減らして負荷軽減
				});
			
			// 並行処理数を制限
			const batchSize = 5;
			for (let i = 0; i < follows.data.follows.length; i += batchSize) {
				const batch = follows.data.follows.slice(i, i + batchSize);
				await Promise.allSettled(
					batch.map(async (follow) => {
						try {
							const userRes = await a.com.atproto.repo.listRecords({
								repo: follow.did,
								collection: COL.thread,
								limit: 10  // limit を減らして負荷軽減
							});
							
							for (const r of userRes.data.records) {
								const threadValue = r.value as ThreadRecord;
								if (!board || threadValue.board === board) {
									allThreads.push({ uri: r.uri, cid: r.cid, value: threadValue });
								}
							}
						} catch (error) {
							console.debug('Failed to fetch threads for user:', follow.did, error);
						}
					})
				);
			}
			} catch (error) {
				console.debug('Failed to fetch follows:', error);
			}
		}

	} catch (error) {
		console.error('Failed to fetch threads:', error);
	}
	
	return allThreads
		.sort((a, b) => (a.value.createdAt === b.value.createdAt ? a.uri.localeCompare(b.uri) : a.value.createdAt.localeCompare(b.value.createdAt)))
		.reverse();
}

export async function createThread(input: { board?: BoardId; title: string }) {
	// バリデーション
	if (!validateThreadTitle(input.title)) {
		throw new Error('スレッドタイトルは200文字以内である必要があります');
	}
	if (input.board && !validateBoardId(input.board)) {
		throw new Error('ボード名は英数字・ハイフン・アンダースコアのみ使用可能で、50文字以内である必要があります');
	}

	const s = get(session);
	const a = getAgent();
    const record: ThreadRecord = { board: input.board, title: input.title, createdAt: new Date().toISOString() };
    const res = await a.com.atproto.repo.createRecord({ repo: s.did!, collection: COL.thread, record });
	return res.data;
}

export async function createBoard(name: string, description?: string) {
	// バリデーション
	if (!validateBoardName(name)) {
		throw new Error('ボード名は100文字以内である必要があります');
	}
	if (description && description.length > 1000) {
		throw new Error('説明文は1000文字以内である必要があります');
	}

	const s = get(session);
	const a = getAgent();
	
	// 重複しない識別子を生成（簡易版）
	let boardId: string;
	let attempts = 0;
	const maxAttempts = 5; // 試行回数を減らす
	
	// 既存ボードの取得は1回のみ（boardInfoとthreadの両方をチェック）
	let existingBoards: string[] = [];
	try {
		// ボード情報レコードから取得
		const boardInfoRes = await a.com.atproto.repo.listRecords({ 
			repo: s.did!, 
			collection: COL.boardInfo, 
			limit: 100 
		});
		existingBoards.push(...boardInfoRes.data.records.map(r => (r.value as BoardInfoRecord).boardId));

		// スレッドレコードからも取得
		const threadRes = await a.com.atproto.repo.listRecords({ 
			repo: s.did!, 
			collection: COL.thread, 
			limit: 100 
		});
		existingBoards.push(...threadRes.data.records
			.map(r => (r.value as ThreadRecord).board)
			.filter(board => board) // undefinedを除外
		);

		// 重複を除去
		existingBoards = Array.from(new Set(existingBoards));
	} catch (error) {
		console.warn('Failed to fetch existing boards for duplicate check:', error);
	}
	
	do {
		boardId = generateBoardId();
		attempts++;
		
		// 既存のボードIDと重複しないかチェック
		if (!existingBoards.includes(boardId)) {
			break; // 重複なし、使用可能
		}
		
		if (attempts >= maxAttempts) {
			// 最大試行回数に達した場合、タイムスタンプを追加して確実に一意にする
			boardId = generateBoardId() + Date.now().toString(36).slice(-4);
			break;
		}
	} while (true);

	// ボード情報レコードを作成（スレッドは作成しない）
    const record: BoardInfoRecord = { 
		boardId: boardId,
		name: name,
		description: description,
		createdAt: new Date().toISOString() 
	};
    const res = await a.com.atproto.repo.createRecord({ 
		repo: s.did!, 
		collection: COL.boardInfo, 
		record 
	});
	return { boardId: boardId, name: name, boardInfo: res.data };
}

export async function getBoardInfo(boardId: string, repo?: string): Promise<BoardInfoRecord | null> {
	// 特定のボード情報を取得
	const s = get(session);
	const a = getAgent();
	
	try {
		const res = await a.com.atproto.repo.listRecords({ 
			repo: repo ?? s.did!, 
			collection: COL.boardInfo, 
			limit: 100 
		});
		
		for (const r of res.data.records) {
			const v = r.value as BoardInfoRecord;
			if (v.boardId === boardId) {
				return v;
			}
		}
		return null;
	} catch (error) {
		console.error('Failed to fetch board info:', error);
		return null;
	}
}

export async function listPosts(repo?: string) {
	const s = get(session);
	const a = getAgent();
    const res = await a.com.atproto.repo.listRecords({ repo: repo ?? s.did!, collection: COL.post, limit: 100 });
	return res.data.records
		.map((r) => ({ uri: r.uri, cid: r.cid, value: r.value as PostRecord }))
		.sort((a, b) => (a.value.createdAt === b.value.createdAt ? a.uri.localeCompare(b.uri) : a.value.createdAt.localeCompare(b.value.createdAt)));
}

export async function createPost(input: { threadUri: string; text: string; refPost?: { uri: string; cid: string } | null }) {
	// バリデーション
	if (!validatePostText(input.text)) {
		throw new Error('投稿は5000文字以内である必要があります');
	}

	const s = get(session);
	const a = getAgent();
	const record: PostRecord = {
		thread: input.threadUri,
		text: input.text,
		refPost: input.refPost ?? null,
		createdAt: new Date().toISOString()
	};
	const res = await a.com.atproto.repo.createRecord({ repo: s.did!, collection: COL.post, record });
	return res.data;
}

export function buildReactionRkey(subjectUri: string, kind: string, did: string) {
	const data = new TextEncoder().encode(`${subjectUri}|${kind}|${did}`);
	let binary = '';
	for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function toggleReaction(params: { subject: { uri: string; cid: string }; reaction: 'like' | 'laugh' | 'sad' | 'angry' | 'star' }) {
	const s = get(session);
	const a = getAgent();
	const rkey = buildReactionRkey(params.subject.uri, params.reaction, s.did!);
	const record = { subject: params.subject, reaction: params.reaction, createdAt: new Date().toISOString() };
	await a.com.atproto.repo.putRecord({ repo: s.did!, collection: COL.reaction, rkey, record });
}

export async function listReactionsForSubject(params: {
    subjectUri: string;
    repo?: string; // 省略時は自分のrepoのみ
    cursor?: string;
    limit?: number; // 最大100
}): Promise<{ records: Array<{ uri: string; cid: string; value: ReactionRecord }>; cursor?: string }>
{
    const s = get(session);
    const a = getAgent();
    const res = await a.com.atproto.repo.listRecords({
        repo: params.repo ?? s.did!,
        collection: COL.reaction,
        limit: Math.min(params.limit ?? 100, 100),
        cursor: params.cursor
    });
    const filtered = res.data.records
        .map((r) => ({ uri: r.uri, cid: r.cid, value: r.value as ReactionRecord }))
        .filter((r) => r.value?.subject?.uri === params.subjectUri);
    return { records: filtered, cursor: res.data.cursor };
}

export function countReactions(records: Array<{ value: ReactionRecord }>): Record<ReactionKind, number> {
    const counts: Record<ReactionKind, number> = { like: 0, laugh: 0, sad: 0, angry: 0, star: 0 };
    for (const r of records) {
        const k = r.value.reaction as ReactionKind;
        if (counts[k] !== undefined) counts[k] += 1;
    }
    return counts;
}


