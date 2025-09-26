<script lang="ts">
    import { session, isLoggedIn } from '$lib/session';
    import { loginWithPassword } from '$lib/atp';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let service = 'https://bsky.social';
    let identifier = '';
    let password = '';
    let error = '';
    let busy = false;

    async function submit(e: Event) {
        e.preventDefault();
        if (!identifier.trim() || !password.trim()) return;
        
        busy = true;
        error = '';
        try {
            await loginWithPassword({
                service: service.trim(),
                identifier: identifier.trim(),
                password: password.trim()
            });
            goto('/home');
        } catch (err: any) {
            error = err.message || 'ログインに失敗しました';
            console.error(err);
            busy = false;
        }
    }

    onMount(() => {
        // 既にログイン済みの場合はホームにリダイレクト
        if (isLoggedIn($session)) {
            goto('/home');
        }
    });
</script>

{#if $session.loaded && !isLoggedIn($session)}
<div class="flex min-h-[60vh] items-center justify-center">
    <div class="card w-full max-w-md p-8">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 dark:bg-blue-900">
                <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Echoskyにログイン</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">ATProto掲示板システムへようこそ</p>
        </div>
        
        <form on:submit={submit} aria-label="login" class="space-y-6">
            <div class="space-y-1">
                <label for="service" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ATProtoサービス</label>
                <input 
                    id="service" 
                    name="service" 
                    bind:value={service} 
                    placeholder="https://bsky.social"
                    class="input-field" 
                    required
                />
            </div>

            <div class="space-y-1">
                <label for="identifier" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ユーザー名またはメール</label>
                <input 
                    id="identifier" 
                    name="identifier" 
                    bind:value={identifier} 
                    autocomplete="username" 
                    placeholder="username.bsky.social"
                    class="input-field" 
                    required
                />
            </div>

            <div class="space-y-1">
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">パスワード</label>
                <input 
                    id="password" 
                    name="password" 
                    type="password"
                    bind:value={password} 
                    autocomplete="current-password" 
                    class="input-field" 
                    required
                />
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    アプリパスワードを使用してください
                </p>
            </div>
            
            {#if error}
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <p role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            {/if}
            
            <button type="submit" disabled={busy} class="btn-primary w-full">
                {#if busy}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ログイン中...
                {:else}
                    ログイン
                {/if}
            </button>
        </form>
    </div>
</div>
{:else}
<div class="text-center py-12">
    <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 dark:bg-green-900">
        <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
    </div>
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">ログイン済み</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-6">Echoskyへようこそ！</p>
    <a href="/home" class="btn-primary">ホームへ移動</a>
</div>
{/if}