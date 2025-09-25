<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { encodeUriForRoute } from '$lib/uri';
    import { listThreads, createThread } from '$lib/api';

    let board = '';
    let threads: Array<{ uri: string; cid: string; value: any }> = [];
    let loading = false;
    let title = '';
    let creating = false;

    function paramBoard(): string { return $page.params.c as string; }

    async function load() {
        loading = true;
        try {
            board = paramBoard();
            const all = await listThreads();
            threads = all.filter((t: { uri: string; cid: string; value: any }) => t.value.board === board);
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
    <div class="flex items-center gap-4">
        <a href="/home" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            戻る
        </a>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{board} ボード</h1>
            <p class="text-gray-600 dark:text-gray-400">スレッド一覧</p>
        </div>
        <span class="badge badge-primary">{threads.length} スレッド</span>
    </div>

    <!-- スレッド一覧 -->
    <section class="space-y-4">
        {#if loading}
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600 dark:text-gray-400">読み込み中...</span>
            </div>
        {:else if threads.length === 0}
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">スレッドがありません</h3>
                <p class="mt-2 text-gray-600 dark:text-gray-400">このボードで最初のスレッドを作成しましょう</p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each threads as t}
                    <a href={'/home/t/' + encodeUriForRoute(t.uri)} class="card p-4 hover:scale-[1.02] transition-transform duration-200">
                        <div class="flex items-center gap-3">
                            <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">{t.value.title}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(t.value.createdAt).toLocaleDateString('ja-JP')}
                                </p>
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
            <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center dark:bg-purple-900">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">新規スレッド作成</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{board} ボードに新しいスレッドを作成</p>
            </div>
        </div>
        
        <form on:submit={submitNew} aria-label="create-thread" class="space-y-4">
            <div class="space-y-1">
                <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">スレッドタイトル</label>
                <input 
                    id="title"
                    placeholder="スレッドのタイトルを入力してください" 
                    bind:value={title} 
                    required 
                    class="input-field" 
                />
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


