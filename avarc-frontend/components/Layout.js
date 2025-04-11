import { useEffect, useState } from 'react';

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
      <main>{children}</main>
    </div>
  );
}
