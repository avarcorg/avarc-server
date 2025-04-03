import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/authService';

function Login({ setUser, setToken }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log("Attempting login with:", form);
    const res = await AuthService.loginUser(form.username, form.password);
    console.log("Login response:", res);
    if (res.token && res.user) {
      localStorage.setItem('jwt', res.token);
      localStorage.setItem('username', res.user.username);
      console.log("Setting user in state:", res.user.username);
      if (setUser) setUser(res.user.username);
      if (setToken) setToken(res.token);
      console.log("Navigating to /dashboard");
      navigate('/dashboard');
    } else {
      console.log("Login failed:", res.errorMessage);
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
