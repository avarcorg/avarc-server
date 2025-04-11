import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../../services/authService';
import Layout from '../../components/Layout';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const res = await AuthService.registerUser(form.username, form.password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setMessage('Registration failed.');
      }
    } catch (error) {
      setMessage(error.message || 'Registration failed.');
    }
  };

  return (
    <Layout>
      <h3>Register</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleRegister}>Register</button>
      <p>{message}</p>
    </Layout>
  );
}
