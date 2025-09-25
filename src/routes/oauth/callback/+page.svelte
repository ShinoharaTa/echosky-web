<script lang="ts">
    import { onMount } from 'svelte';
    import { handleOAuthCallback, getSessionInfo } from '$lib/oauth';
    import { session } from '$lib/session';
    import { goto } from '$app/navigation';

    let status = 'processing';
    let error = '';

    onMount(async () => {
        try {
            const result = await handleOAuthCallback();
            const oauthSession = result.session;
            const sessionInfo = getSessionInfo(oauthSession);
            
            // セッション情報を更新
            session.set({
                did: sessionInfo.did,
                handle: sessionInfo.handle,
                accessJwt: null, // OAuth使用時は不要
                refreshJwt: null, // OAuth使用時は不要
                pdsUrl: sessionInfo.pdsUrl,
                loaded: true,
                oauthSession: oauthSession
            });

            status = 'success';
            
            // ホームページにリダイレクト
            setTimeout(() => {
                goto('/home');
            }, 2000);
            
        } catch (err) {
            console.error('OAuth callback error:', err);
            status = 'error';
            error = 'ログインに失敗しました';
        }
    });
</script>

<div class="flex min-h-[60vh] items-center justify-center">
    <div class="card w-full max-w-md p-8 text-center">
        {#if status === 'processing'}
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 dark:bg-blue-900">
                <svg class="animate-spin w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">ログイン処理中</h1>
            <p class="text-gray-600 dark:text-gray-400">しばらくお待ちください...</p>
        {:else if status === 'success'}
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 dark:bg-green-900">
                <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">ログイン成功</h1>
            <p class="text-gray-600 dark:text-gray-400">ホームページにリダイレクトしています...</p>
        {:else if status === 'error'}
            <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 dark:bg-red-900">
                <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">エラーが発生しました</h1>
            <p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <a href="/" class="btn-primary">ログインページに戻る</a>
        {/if}
    </div>
</div>
