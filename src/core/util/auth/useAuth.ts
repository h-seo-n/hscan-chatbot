import { useAuth as useOidcAuth } from 'react-oidc-context';
import type { UserInfo } from '../types/generalTypes';
import { useUserStore } from './userStore';

/**
 * Keycloak 인증 액션을 캡슐화한 커스텀 훅
 *
 * react-oidc-context의 useAuth를 그대로 노출하지 않고 wrapping함
 */
export function useAuth() {
  const auth = useOidcAuth();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const fetchUser = async (): Promise<UserInfo | null> => {
    const token = auth.user?.access_token;
    if (!token) return null;

    const res = await fetch(
      `${import.meta.env.VITE_HEALTHINFO_API_URL}userinfo`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`fetchUser failed: ${res.status}`);

    const data: UserInfo = await res.json();
    setUser(data);
    return data;
  };

  return {
    // 상태
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    user,
    accessToken: auth.user?.access_token,

    // 액션
    /** 
     * Keycloak 로그인 페이지로 리다이렉트 
    */
    login: () => {
      auth.signinRedirect()
      
    },

    /**
     * Keycloak 회원가입 페이지로 리다이렉트
     */
    signup: () =>
      auth.signinRedirect({
        extraQueryParams: { kc_action: 'register' },
      }),

    /** Keycloak 로그아웃 후 post_logout_redirect_uri로 복귀 */
    logout: () =>
      auth.signoutRedirect({
        post_logout_redirect_uri: import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_URI,
      }),

    fetchUser,
  };
}