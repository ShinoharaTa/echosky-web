<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { resumeSession } from '$lib/atp';
    import { session, isLoggedIn, clearSession } from '$lib/session';
    import '../app.css';

	let { children } = $props();

    function handleLogout() {
        // 確認ダイアログを表示
        if (!confirm('ログアウトしますか？')) {
            return;
        }

        // セッションをクリア
        clearSession();
        // ログインページにリダイレクト
        window.location.href = '/';
    }

    onMount(() => {
        resumeSession();
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/80">
        <div class="container-page flex items-center h-16 gap-4">
            <a href="/" class="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Echosky
            </a>
            <nav class="ml-auto flex items-center gap-6">
                {#if $session.loaded && isLoggedIn($session)}
                    <a href="/home" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                        ホーム
                    </a>
                    <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            {$session.handle || $session.did}
                        </span>
                        <button 
                            onclick={handleLogout}
                            class="btn-secondary text-sm px-3 py-1.5"
                            aria-label="ログアウト"
                        >
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            ログアウト
                        </button>
                    </div>
                {:else}
                    <a href="/" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                        ログイン
                    </a>
                {/if}
            </nav>
        </div>
    </header>
    <main class="flex-1 container-page py-8">
        {@render children?.()}
    </main>
    <footer class="border-t border-gray-200/50 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-800/50">
        <div class="container-page py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 EchoSky - ATProto掲示板システム
        </div>
    </footer>
</div>
