import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Layout({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    const user = localStorage.getItem('username');
    setToken(jwt);
    setUsername(user);
  }, []);

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <div>
      <nav style={{ marginBottom: '1rem' }}>
        <Link href="/">Home</Link> |{' '}
        {!token && (
          <>
            <Link href="/auth/login">Login</Link> |{' '}
            <Link href="/auth/register">Register</Link> |{' '}
          </>
        )}
        {token && (
          <>
            <Link href="/dashboard">Dashboard</Link> |{' '}
            <button onClick={logout} style={{ cursor: 'pointer' }}>Logout</button> |{' '}
            <span>Hello, {username}!</span>
          </>
        )}
      </nav>
      <main>{children}</main>
    </div>
  );
}
