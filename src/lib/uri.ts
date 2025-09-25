export function encodeUriForRoute(uri: string): string {
	return btoa(uri).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeUriFromRoute(token: string): string {
	const pad = token.length % 4 === 0 ? '' : '='.repeat(4 - (token.length % 4));
	const b64 = token.replaceAll('-', '+').replaceAll('_', '/') + pad;
	return atob(b64);
}


