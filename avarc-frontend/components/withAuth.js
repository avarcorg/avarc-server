import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

export function withAuth(WrappedComponent, options = { requireAuth: true }) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [state, setState] = useState({
      verified: false,
      loading: true,
      error: null
    });

    useEffect(() => {
      const verifyAuth = async () => {
        const token = localStorage.getItem('jwt');

        // If auth is not required, just set verified to true
        if (!options.requireAuth) {
          setState({
            verified: true,
            loading: false,
            error: null
          });
          return;
        }

        if (!token) {
          setState({
            verified: false,
            loading: false,
            error: 'No token found'
          });
          router.push('/auth/login');
          return;
        }

        try {
          const user = await AuthService.authenticateWithToken(token);
          setState({
            verified: true,
            loading: false,
            error: null,
            user
          });
        } catch (err) {
          console.error('Authentication error:', err);
          setState({
            verified: false,
            loading: false,
            error: err.message
          });
          // Only clear auth data if it's an authentication error
          if (err.status === 401) {
            localStorage.removeItem('jwt');
            localStorage.removeItem('username');
            localStorage.removeItem('uuid');
            localStorage.removeItem('roles');
          }
          router.push('/auth/login');
        }
      };

      verifyAuth();
    }, [router]);

    if (state.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading...</div>
        </div>
      );
    }

    if (!state.verified) {
      return null; // Don't render anything while redirecting
    }

    return <WrappedComponent {...props} user={state.user} />;
  };
}
