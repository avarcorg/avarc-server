import React, { useState } from 'react';
import { loginUser } from '../../services/authService';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    const token = await loginUser(form.username, form.password);
    alert("JWT Token: " + token);
  };

  return (
    <div>
      <h3>Login</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
