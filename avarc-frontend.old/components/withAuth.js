import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { AuthService } from '../services/authService';
import { useSafeTranslation } from '../utils/translation';

export function withAuth(WrappedComponent, options = { requireAuth: true }) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const { safeTranslate } = useSafeTranslation(['common', 'auth']);
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
            error: safeTranslate('noToken', 'auth')
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
          console.error(safeTranslate('error', 'auth'), err);
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
    }, [router, router.locale]);

    if (state.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>{safeTranslate('loading', 'common')}</div>
        </div>
      );
    }

    if (!state.verified) {
      return null; // Don't render anything while redirecting
    }

    return <WrappedComponent {...props} user={state.user} />;
  };
}
