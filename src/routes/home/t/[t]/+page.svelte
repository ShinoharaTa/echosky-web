<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { decodeUriFromRoute } from '$lib/uri';
    import { listPosts, createPost, toggleReaction } from '$lib/api';
    // dayjs を使わず Intl で整形

    type Item = { uri: string; cid: string; value: any };
    let threadUri = '';
    let posts = $state<Item[]>([]);
    let loading = $state(false);
    let text = $state('');
    let sending = $state(false);
    let error = $state('');
    let draftKey = '';

    function paramToUri(): string {
        const token = $page.params.t as string;
        return decodeUriFromRoute(token);
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem(draftKey);
            if (raw) text = raw;
        } catch {}
    }

    function saveDraft() {
        try {
            localStorage.setItem(draftKey, text);
        } catch {}
    }

    async function load() {
        loading = true;
        try {
            threadUri = paramToUri();
            draftKey = `draft:${threadUri}`;
            loadDraft();
            const all = await listPosts();
            posts = all.filter((p: Item) => p.value.thread === threadUri);
        } finally {
            loading = false;
        }
    }

    async function submitPost(e: Event) {
        e.preventDefault();
        if (!text.trim()) return;
        sending = true;
        error = '';
        try {
            await createPost({ threadUri, text });
            text = '';
            localStorage.removeItem(draftKey);
            await load();
        } catch (err) {
            error = '投稿に失敗しました。再試行してください。';
            saveDraft();
            console.error(err);
        } finally {
            sending = false;
        }
    }

    function linkifyMentions(s: string): string {
        return s.replace(/@([a-z0-9_.-]+)/gi, '<a href="https://bsky.app/profile/$1" target="_blank">@$1<\/a>');
    }

    function linkifyAnchors(s: string): string {
        return s.replace(/>>([0-9]+)/g, '<a href="#r$1">>>$1<\/a>');
    }

    function renderText(s: string): string {
        return linkifyAnchors(linkifyMentions(escapeHtml(s)));
    }

    function escapeHtml(s: string): string {
        return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    function jumpTo(n: number) {
        const el = document.getElementById(`r${n}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function react(item: Item, kind: 'like' | 'laugh' | 'sad' | 'angry' | 'star') {
        await toggleReaction({ subject: { uri: item.uri, cid: item.cid }, reaction: kind });
    }

    $effect(() => {
        // text が変化するたびに保存
        void text;
        saveDraft();
    });

    onMount(load);
</script>

<div class="space-y-6">
    <!-- ヘッダー -->
    <div class="flex items-center gap-4">
        <button onclick={() => history.back()} class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            戻る
        </button>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">スレッド詳細</h1>
            <p class="text-gray-600 dark:text-gray-400">投稿とディスカッション</p>
        </div>
        <span class="badge badge-primary">{posts.length} 投稿</span>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400">読み込み中...</span>
        </div>
    {:else}
        <!-- 投稿一覧 -->
        <div class="space-y-4">
            {#each posts as p, i}
                <article id={`r${i + 1}`} class="card p-6">
                    <header class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm font-semibold">#{i + 1}</span>
                            </div>
                            <div>
                                <time class="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(p.value.createdAt).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </time>
                            </div>
                        </div>
                        <a href={`#r${i + 1}`} class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            #{i + 1}
                        </a>
                    </header>
                    
                    <div class="prose prose-sm dark:prose-invert max-w-none mb-4">
                        {@html renderText(p.value.text)}
                    </div>
                    
                    <footer class="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button onclick={() => react(p, 'like')} aria-label="いいね" class="btn-secondary text-sm px-3 py-1.5">
                            👍 いいね
                        </button>
                        <button onclick={() => react(p, 'laugh')} aria-label="笑い" class="btn-secondary text-sm px-3 py-1.5">
                            😄 笑い
                        </button>
                        <button onclick={() => react(p, 'sad')} aria-label="悲しい" class="btn-secondary text-sm px-3 py-1.5">
                            😢 悲しい
                        </button>
                        <button onclick={() => react(p, 'angry')} aria-label="怒り" class="btn-secondary text-sm px-3 py-1.5">
                            😡 怒り
                        </button>
                        <button onclick={() => react(p, 'star')} aria-label="スター" class="btn-secondary text-sm px-3 py-1.5">
                            ⭐ スター
                        </button>
                    </footer>
                </article>
            {/each}
        </div>

        <!-- 新規投稿フォーム -->
        <div class="card p-6 sticky bottom-4">
            <div class="flex items-center gap-3 mb-4">
                <div class="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center dark:bg-orange-900">
                    <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">返信を投稿</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">このスレッドに参加しましょう</p>
                </div>
            </div>
            
            <form onsubmit={submitPost} aria-label="create-post" class="space-y-4">
                <div class="space-y-1">
                    <label for="post-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300">投稿内容</label>
                    <textarea 
                        id="post-text"
                        bind:value={text} 
                        rows={4} 
                        placeholder="あなたの考えを共有してください..." 
                        class="input-field resize-none"
                    ></textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        @ユーザー名 でメンション、>>数字 でアンカーが使用できます
                    </p>
                </div>
                
                {#if error}
                    <div class="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                        <p role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                {/if}
                
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {text.length} 文字
                    </div>
                    <button disabled={sending || !text.trim()} class="btn-primary">
                        {#if sending}
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            投稿中...
                        {:else}
                            投稿する
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>


