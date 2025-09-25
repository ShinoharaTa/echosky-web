import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import type { OAuthSession } from '@atproto/oauth-client-browser';

// OAuth設定 - 環境に応じた動的設定
const isLocal = typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : import.meta.env.VITE_ENV === 'local';

const BASE_URL = isLocal ? `http://${typeof window !== 'undefined' ? window.location.host.replace('localhost', '127.0.0.1') : '127.0.0.1:5173'}` : 'https://echosky.app';
const CLIENT_ID = 'https://echosky.app/client-metadata.json'; // クライアントIDは常に本番URL
const REDIRECT_URI = `${BASE_URL}/oauth/callback`;

// CLIENT_METADATA は static/client-metadata.json から自動読み込み

// OAuthクライアントの初期化
let oauthClient: BrowserOAuthClient | null = null;

export async function initOAuthClient() {
    if (oauthClient) return oauthClient;
    
    try {
        // ブラウザ環境での初期化
        oauthClient = await BrowserOAuthClient.load({
            clientId: CLIENT_ID,
            handleResolver: 'https://bsky.social',
        });
        
        console.log(`OAuth initialized for ${isLocal ? 'local' : 'production'} environment`);
        console.log(`Redirect URI: ${REDIRECT_URI}`);
        
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
        const session = await client.restore('');
        return session;
    } catch (error) {
        console.error('Session restore error:', error);
        // セッション復元に失敗した場合、古いセッションデータをクリア
        try {
            const client = await initOAuthClient();
            await client.revoke('').catch(() => {}); // エラーを無視
        } catch (revokeError) {
            console.error('Failed to revoke session:', revokeError);
        }
        return null;
    }
}

// セッション情報からユーザー情報を取得
export function getSessionInfo(session: OAuthSession) {
    return {
        did: session.sub,
        handle: (session as any).info?.handle || null,
        pdsUrl: (session as any).info?.pds || (session as any).server,
    };
}

// ログアウト
export async function logout() {
    try {
        const client = await initOAuthClient();
        await client.revoke('');
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

// 破損したセッションデータをクリア
export async function clearCorruptedSession() {
    if (typeof window === 'undefined') return;
    
    try {
        // IndexedDBのOAuthデータをクリア
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name && (db.name.includes('oauth') || db.name.includes('atproto'))) {
                const deleteRequest = indexedDB.deleteDatabase(db.name);
                await new Promise((resolve, reject) => {
                    deleteRequest.onsuccess = () => resolve(undefined);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
        }
        
        // LocalStorageのOAuthデータもクリア
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('oauth') || key.includes('atproto'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Cleared corrupted OAuth session data');
    } catch (error) {
        console.error('Failed to clear corrupted session data:', error);
    }
}
