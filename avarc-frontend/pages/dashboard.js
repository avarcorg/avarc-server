import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    const user = localStorage.getItem('username');
    if (!jwt) {
      router.push('/auth/login');
    } else {
      setToken(jwt);
      setUsername(user);
    }
  }, []);

  return (
    <Layout>
      <h2>Dashboard</h2>
      <p>Welcome, {username}</p>
    </Layout>
  );
}
