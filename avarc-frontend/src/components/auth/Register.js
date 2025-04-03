import React, { useState } from 'react';
import { registerUser } from '../../services/authService';

function Register() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    const res = await registerUser(form.username, form.password);
    if (res.token && res.user) {
      setMessage('Registered: ' + res.user.username);
      localStorage.setItem('jwt', res.token);
    } else {
      setMessage('Error: ' + (res.errorMessage || 'Registration failed.'));
    }
  };

  return (
    <div>
      <h3>Register</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleRegister}>Register</button>
      <p>{message}</p>
    </div>
  );
}

export default Register;
