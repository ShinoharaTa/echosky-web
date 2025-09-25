import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import type { OAuthSession } from '@atproto/oauth-client-browser';

// OAuth設定 - 本番環境用の設定
const CLIENT_ID = 'https://echosky.app';
const CLIENT_METADATA = {
    client_id: CLIENT_ID,
    client_name: 'EchoSky',
    client_uri: 'https://echosky.app',
    redirect_uris: ['https://echosky.app/oauth/callback'],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true
};

// OAuthクライアントの初期化
let oauthClient: BrowserOAuthClient | null = null;

export async function initOAuthClient() {
    if (oauthClient) return oauthClient;
    
    try {
        // ブラウザ環境での初期化
        oauthClient = await BrowserOAuthClient.load({
            clientId: CLIENT_ID,
            clientMetadata: CLIENT_METADATA,
        });
        
        return oauthClient;
    } catch (error) {
        console.error('OAuth client initialization error:', error);
        throw error;
    }
}

// OAuth認証開始
export async function startOAuthLogin(handle: string) {
    try {
        const client = await initOAuthClient();
        
        // 認証URLを生成してリダイレクト
        const url = await client.authorize(handle, {
            scope: 'atproto transition:generic'
        });
        
        window.location.href = url.toString();
    } catch (error) {
        console.error('OAuth login error:', error);
        throw error;
    }
}

// OAuthコールバック処理
export async function handleOAuthCallback() {
    try {
        const client = await initOAuthClient();
        const params = new URLSearchParams(window.location.search);
        
        const result = await client.callback(params);
        return result;
    } catch (error) {
        console.error('OAuth callback error:', error);
        throw error;
    }
}

// 現在のセッション取得
export async function getCurrentSession(): Promise<OAuthSession | null> {
    try {
        const client = await initOAuthClient();
        const session = await client.restore();
        return session;
    } catch (error) {
        console.error('Session restore error:', error);
        return null;
    }
}

// セッション情報からユーザー情報を取得
export function getSessionInfo(session: OAuthSession) {
    return {
        did: session.sub,
        handle: session.info?.handle || null,
        pdsUrl: session.info?.pds || session.server,
    };
}

// ログアウト
export async function logout() {
    try {
        const client = await initOAuthClient();
        await client.revoke();
    } catch (error) {
        console.error('Logout error:', error);
        // エラーが発生してもログアウト処理を続行
    }
}

// ログアウトしてホームページにリダイレクト
export async function logoutAndRedirect() {
    await logout();
    // ホームページにリダイレクト
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
}
