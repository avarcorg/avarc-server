import React, { useState } from 'react';
import { loginUser } from '../../services/authService';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const res = await loginUser(form.username, form.password);
    if (res.token && res.user) {
      setMessage('Login successful: ' + res.user.username);
      localStorage.setItem('jwt', res.token);
    } else {
      setMessage('Error: ' + (res.errorMessage || 'Login failed.'));
    }
  };

  return (
    <div>
      <h3>Login</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
    </div>
  );
}

export default Login;
