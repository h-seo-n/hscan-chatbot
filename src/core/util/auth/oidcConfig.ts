import { WebStorageStateStore } from 'oidc-client-ts';
import type { AuthProviderProps } from 'react-oidc-context';

export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID, // Keycloak admin console에서 public client id 필요
  // client_secret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET,
  redirect_uri: import.meta.env.VITE_KEYCLOAK_REDIRECT_URI, // KeyCloak client 설정 "Valid Redirect URIs에 같은 값 등록 필요"
  post_logout_redirect_uri: import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_URI,

  // PKCE는 oidc-client-ts에서 기본 활성화되어 있음
  response_type: 'code',
  scope: 'openid profile email',

  // 토큰 자동 갱신 (만료 60초 전)
  automaticSilentRenew: true,

  // sessionStorage 사용 : XSS 노출 최소화 위해 localStorage보다 권장됨
  // Keycloak이 frontchannel logout 지원하므로 탭 간 동기화도 가능
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // 로그인 콜백 처리 후 URL에서 code, state 파라미터 제거
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};