<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { resumeSession } from '$lib/atp';
    import { session } from '$lib/session';
    import '../app.css';

	let { children } = $props();

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
                EchoSky
            </a>
            <nav class="ml-auto flex items-center gap-6">
                <a href="/home" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                    ホーム
                </a>
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
