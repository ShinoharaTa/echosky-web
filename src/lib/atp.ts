import { BskyAgent, type AtpSessionData } from '@atproto/api';
import { get } from 'svelte/store';
import { session } from './session';

export type PdsConfig = {
	service: string; // e.g. https://bsky.social or custom PDS
};

let agent: BskyAgent | null = null;

export function getAgent(config?: PdsConfig): BskyAgent {
	const current = get(session);
	const service = config?.service ?? current.pdsUrl ?? 'https://bsky.social';
	if (!agent || agent.service?.origin !== new URL(service).origin) {
		agent = new BskyAgent({ service });
	}
	return agent;
}

export async function loginWithPassword(params: {
	service: string;
	identifier: string; // handle or email
	password: string;
}): Promise<void> {
	const a = getAgent({ service: params.service });
	const res = await a.login({ identifier: params.identifier, password: params.password });
	session.set({
		did: res.data.did,
		handle: res.data.handle,
		accessJwt: res.data.accessJwt,
		refreshJwt: res.data.refreshJwt,
		pdsUrl: params.service,
		loaded: true
	});
}

export async function resumeSession(): Promise<boolean> {
	const s = get(session);
	
	// JWTベースセッション
	if (!s.refreshJwt || !s.pdsUrl) return false;
	const a = getAgent({ service: s.pdsUrl });
	try {
		await a.resumeSession({
			did: s.did!,
			handle: s.handle!,
			accessJwt: s.accessJwt!,
			refreshJwt: s.refreshJwt!,
			active: true
		} as AtpSessionData);
		return true;
	} catch {
		return false;
	}
}


