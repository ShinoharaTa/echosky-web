<script lang="ts">
    import { onMount } from 'svelte';
    import { session, isLoggedIn } from '$lib/session';
    import { get } from 'svelte/store';

    let { children } = $props();

    onMount(() => {
        const s = get(session);
        if (!isLoggedIn(s)) {
            location.href = '/';
        }
    });
</script>

{@render children?.()}


