import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../../services/authService';
import Layout from '../../components/Layout';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const res = await AuthService.loginUser(form.username, form.password);
    if (res.token && res.user) {
      localStorage.setItem('jwt', res.token);
      localStorage.setItem('username', res.user.username);
      router.push('/dashboard');
    } else {
      setMessage(res.errorMessage || 'Login failed.');
    }
  };

  return (
    <Layout>
      <h3>Login</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
    </Layout>
  );
}
