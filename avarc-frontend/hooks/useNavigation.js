import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';

export const useNavigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('jwt');
      const storedUsername = localStorage.getItem('username');
      console.log('[useNavigation] checkAuth:', { token, storedUsername });
      if (token && storedUsername) {
        setIsAuthenticated(true);
        setUsername(storedUsername);
        console.log('[useNavigation] Authenticated:', { isAuthenticated: true, username: storedUsername });
      } else {
        setIsAuthenticated(false);
        setUsername('');
        console.log('[useNavigation] Not authenticated');
      }
    };
    checkAuth();
    router.events.on('routeChangeComplete', checkAuth);
    return () => {
      router.events.off('routeChangeComplete', checkAuth);
    };
  }, [router.events]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setUsername('');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated,
    username,
    handleLogout
  };
};
