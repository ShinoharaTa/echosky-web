<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { session, isLoggedIn } from '$lib/session';
    import { listBoards, createBoard, listThreads } from '$lib/api';

    let boards: string[] = [];
    let boardThreadCounts: Record<string, number> = {};
    let boardName = '';
    let boardDescription = '';
    let loading = false;
    let creating = false;

    async function load() {
        loading = true;
        try {
            boards = await listBoards(false); // フォロー取得を無効にして負荷軽減
            
            // 各ボードのスレッド数を効率的に取得
            boardThreadCounts = {};
            if (boards.length > 0) {
                try {
                    // 自分のスレッドレコードを一度だけ取得
                    const { getAgent } = await import('$lib/atp');
                    const a = getAgent();
                    const myRes = await a.com.atproto.repo.listRecords({ 
                        repo: $session.did!, 
                        collection: 'app.echosky.board.thread', 
                        limit: 100 
                    });
                    
                    // ボードごとにスレッド数をカウント
                    for (const boardName of boards) {
                        const threadsForBoard = myRes.data.records.filter(r => {
                            const thread = r.value as any;
                            return thread.board === boardName;
                        });
                        boardThreadCounts[boardName] = threadsForBoard.length;
                    }
                } catch (error) {
                    console.debug('Failed to get thread counts efficiently, setting to 0');
                    // エラー時はデフォルト値
                    for (const boardName of boards) {
                        boardThreadCounts[boardName] = 0;
                    }
                }
            }
        } finally {
            loading = false;
        }
    }

    async function submitNew(e: Event) {
        e.preventDefault();
        if (!boardName.trim()) return;
        
        creating = true;
        try {
            const result = await createBoard(
                boardName.trim(), 
                boardDescription.trim() || undefined
            );
            
            // フォームをクリア
            boardName = '';
            boardDescription = '';
            
            // 作成したボードページに遷移
            goto(`/c/${encodeURIComponent(result.boardId)}`);
        } catch (error: any) {
            alert(error.message || 'ボードの作成に失敗しました');
        } finally {
            creating = false;
        }
    }

    onMount(() => {
        // ログインチェック
        if (!isLoggedIn($session)) {
            goto('/login');
            return;
        }
        load();
    });
</script>

<svelte:head>
    <title>ホーム - Echosky</title>
    <meta name="description" content="Echoskyホーム - ATProto掲示板システム" />
</svelte:head>

{#if $session.loaded && isLoggedIn($session)}
<div class="space-y-8">
    <!-- ヘッダー -->
    <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Echosky ホーム</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">ATProto掲示板システム</p>
        <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm dark:bg-blue-900/30 dark:text-blue-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path>
            </svg>
            ログイン中: {$session.handle ?? $session.did}
        </div>
    </div>

    <!-- ボード一覧 -->
    <section class="space-y-6">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">ボード一覧</h2>
            <span class="badge badge-primary">{boards.length} ボード</span>
        </div>
        
        {#if loading}
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600 dark:text-gray-400">読み込み中...</span>
            </div>
        {:else if boards.length === 0}
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">ボードがありません</h3>
                <p class="mt-2 text-gray-600 dark:text-gray-400">新しいスレッドを作成してボードを開始しましょう</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {#each boards as b}
                    <a href={'/c/' + b} class="card p-6 hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                        <div class="flex items-center gap-4">
                            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">{b.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{b}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    {boardThreadCounts[b] || 0} スレッド
                                </p>
                            </div>
                            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </section>

    <!-- 新規ボード作成 -->
    <section class="card p-6">
        <div class="flex items-center gap-3 mb-6">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">新規ボード作成</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">新しいボードを作成しましょう</p>
            </div>
        </div>
        
        <form on:submit={submitNew} aria-label="create-board" class="space-y-4">
            <div class="space-y-1">
                <label for="boardName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ボード名</label>
                <input 
                    id="boardName"
                    placeholder="例: 雑談, 技術, ニュース" 
                    bind:value={boardName} 
                    maxlength="100"
                    required 
                    class="input-field" 
                />
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ボードの名前（100文字以内）
                </p>
            </div>
            
            <div class="space-y-1">
                <label for="boardDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300">説明（任意）</label>
                <textarea 
                    id="boardDescription"
                    placeholder="ボードの説明を入力してください" 
                    bind:value={boardDescription} 
                    maxlength="1000"
                    rows="3"
                    class="input-field resize-none" 
                ></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ボードの説明文（1000文字以内、任意）<br>
                    ボードIDは自動生成され、作成後はスレッド0件のボードページに移動します
                </p>
            </div>
            
            <div class="flex items-center justify-between pt-4">
                <button disabled={creating || !boardName.trim()} class="btn-primary">
                    {#if creating}
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        作成中...
                    {:else}
                        ボードを作成
                    {/if}
                </button>
            </div>
        </form>
    </section>
</div>
{:else}
<div class="flex items-center justify-center min-h-[60vh]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span class="ml-3 text-gray-600 dark:text-gray-400">読み込み中...</span>
</div>
{/if}