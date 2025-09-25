import { writable } from 'svelte/store';

export type SessionState = {
	did: string | null;
	handle: string | null;
	accessJwt: string | null;
	refreshJwt: string | null;
	pdsUrl: string | null;
	loaded: boolean;
};

const STORAGE_KEY = 'echosky.session.v1';

function loadFromStorage(): SessionState {
	if (typeof localStorage === 'undefined') {
		return {
			did: null,
			handle: null,
			accessJwt: null,
			refreshJwt: null,
			pdsUrl: null,
			loaded: true
		};
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) throw new Error('empty');
		const parsed = JSON.parse(raw) as SessionState;
		return { ...parsed, loaded: true };
	} catch {
		return {
			did: null,
			handle: null,
			accessJwt: null,
			refreshJwt: null,
			pdsUrl: null,
			loaded: true
		};
	}
}

export const session = writable<SessionState>(loadFromStorage());

session.subscribe((value) => {
	try {
		if (typeof localStorage === 'undefined') return;
		const { loaded, ...persistable } = value;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
	} catch {
		// ignore
	}
});

export function clearSession() {
	session.set({
		did: null,
		handle: null,
		accessJwt: null,
		refreshJwt: null,
		pdsUrl: null,
		loaded: true
	});
}

export function isLoggedIn(state: SessionState): boolean {
	return Boolean(state?.did && state?.accessJwt);
}


