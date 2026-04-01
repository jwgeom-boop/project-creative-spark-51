import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// 🔓 임시: 공유용으로 로그인 보호 비활성화 (나중에 원복 필요)
const BYPASS_AUTH = true;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (BYPASS_AUTH) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
