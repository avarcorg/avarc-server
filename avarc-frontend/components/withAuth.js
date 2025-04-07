import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

export function withAuth(WrappedComponent) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [state, setState] = useState({
      verified: false,
      loading: true,
      error: null
    });

    useEffect(() => {
      const verifyAuth = async () => {
        try {
          const user = await AuthService.getCurrentUser();
          setState({
            verified: true,
            loading: false,
            error: null,
            user
          });
        } catch (err) {
          setState({
            verified: false,
            loading: false,
            error: err.message
          });
          router.replace('/auth/login');
        }
      };

      verifyAuth();
    }, []);

    if (state.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading...</div>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Authentication Error: {state.error}</div>
        </div>
      );
    }

    return <WrappedComponent {...props} user={state.user} />;
  };
}
