<script lang="ts">
    import { onMount } from 'svelte';
    import { session } from '$lib/session';
    import { listBoards, createThread, listThreads } from '$lib/api';

    let boards: string[] = [];
    let title = '';
    let board = '';
    let loading = false;
    let creating = false;

    async function load() {
        loading = true;
        try {
            boards = await listBoards();
        } finally {
            loading = false;
        }
    }

    async function submitNew(e: Event) {
        e.preventDefault();
        creating = true;
        try {
            await createThread({ board, title });
            title = '';
            await load();
        } finally {
            creating = false;
        }
    }

    onMount(load);
</script>

<div class="space-y-8">
    <!-- ヘッダー -->
    <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">EchoSky ホーム</h1>
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
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each boards as b}
                    <a href={'/home/c/' + b} class="card p-6 hover:scale-105 transition-transform duration-200">
                        <div class="flex items-center gap-3">
                            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">{b.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{b}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">ボード</p>
                            </div>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </section>

    <!-- 新規スレッド作成 -->
    <section class="card p-6">
        <div class="flex items-center gap-3 mb-6">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">新規スレッド作成</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">新しい話題を始めましょう</p>
            </div>
        </div>
        
        <form on:submit={submitNew} aria-label="create-thread" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-1">
                    <label for="board" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ボード名</label>
                    <input 
                        id="board"
                        placeholder="例: 雑談, 技術, ニュース" 
                        bind:value={board} 
                        required 
                        class="input-field" 
                    />
                </div>
                <div class="space-y-1">
                    <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">スレッドタイトル</label>
                    <input 
                        id="title"
                        placeholder="スレッドのタイトルを入力" 
                        bind:value={title} 
                        required 
                        class="input-field" 
                    />
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-4">
                <button disabled={creating} class="btn-primary">
                    {#if creating}
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        作成中...
                    {:else}
                        スレッドを作成
                    {/if}
                </button>
            </div>
        </form>
    </section>
</div>


