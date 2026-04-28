import { type ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: ReactNode;
}

/**
 * 인증이 필요한 페이지를 감싸는 컴포넌트
 * 미인증 상태면 자동으로 Keycloak 로그인으로 리다이렉트
 */
export default function ProtectedRoute({
  children,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading || !isAuthenticated) {
    return <>{fallback ?? <div>인증 확인 중...</div>}</>;
  }

  return <>{children}</>;
}