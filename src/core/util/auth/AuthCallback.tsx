import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * /auth/callback 라우트에 매핑
 * AuthProvider가 자동으로 code <-> token 교환
 * -> onSigninCallback에서 URL을 정리
 * -> isAuthenticated = true
 */
export default function AuthCallback() {
  const { isLoading, isAuthenticated, error } = useAuth();  

  useEffect(() => {
    if (isAuthenticated) {
      // 인증 완료 후 홈으로
      window.location.replace('/');
    }
  }, [isAuthenticated]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>로그인 처리 중 오류가 발생했어요</h2>
        <p>{error.message}</p>
        <a href="/">홈으로 돌아가기</a>
      </div>
    );
  }

  if (isLoading) {
    return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>로그인 처리 중...</h2>
    </div>)
    ;
  }

  return null;
}