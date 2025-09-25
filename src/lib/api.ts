import { getAgent } from './atp';
import { get } from 'svelte/store';
import { session } from './session';

// ボード（コミュニティ）は thread.record.board の文字列で表現する設計に合わせる
export type BoardId = string;

export type ThreadRecord = {
    title: string;
    board?: BoardId;
    createdAt: string;
};

export type PostRecord = {
	thread: string; // at-uri of thread
	text: string;
	createdAt: string;
	facets?: unknown[];
	refPost?: { uri: string; cid: string } | null;
};

export type ReactionKind = 'like' | 'laugh' | 'sad' | 'angry' | 'star';

export type ReactionRecord = {
    subject: { uri: string; cid: string };
    reaction: ReactionKind;
    createdAt: string;
};

const COL = {
    thread: 'app.echosky.board.thread',
    post: 'app.echosky.board.post',
    reaction: 'app.echosky.board.reaction'
} as const;

// コミュニティ相当は board 文字列の集合で表現（MVP簡易仕様）
export async function listBoards(repo?: string): Promise<BoardId[]> {
    const s = get(session);
    const a = getAgent();
    const res = await a.com.atproto.repo.listRecords({ repo: repo ?? s.did!, collection: COL.thread, limit: 100 });
    const boards = new Set<string>();
    for (const r of res.data.records) {
        const v = r.value as ThreadRecord;
        if (v.board) boards.add(v.board);
    }
    return Array.from(boards).sort();
}

export async function listThreads(repo?: string) {
	const s = get(session);
	const a = getAgent();
	const res = await a.com.atproto.repo.listRecords({
		repo: repo ?? s.did!,
        collection: COL.thread,
		limit: 100
	});
	return res.data.records
        .map((r) => ({ uri: r.uri, cid: r.cid, value: r.value as ThreadRecord }))
		.sort((a, b) => (a.value.createdAt === b.value.createdAt ? a.uri.localeCompare(b.uri) : a.value.createdAt.localeCompare(b.value.createdAt)))
		.reverse();
}

export async function createThread(input: { board?: BoardId; title: string }) {
	const s = get(session);
	const a = getAgent();
    const record: ThreadRecord = { board: input.board, title: input.title, createdAt: new Date().toISOString() };
    const res = await a.com.atproto.repo.createRecord({ repo: s.did!, collection: COL.thread, record });
	return res.data;
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


