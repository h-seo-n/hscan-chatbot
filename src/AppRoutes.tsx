import { Route, Routes } from 'react-router-dom';
import App from './App';
import AuthCallback from './core/util/auth/AuthCallback';
import ProtectedRoute from './core/util/auth/ProtectedRoute';

/**
 * 앱 전체 라우트 정의.
 *
 * 인증 관련 라우트(콜백)는 ProtectedRoute 바깥에 두고,
 * 챗봇처럼 인증이 필요한 페이지는 ProtectedRoute로 감싼다.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Keycloak에서 돌아오는 콜백 : 인증 불필요 */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 메인 챗봇 화면 : 인증 필요 */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}