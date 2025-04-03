import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';

function Register({ setUser, setToken }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    console.log("Attempting registration with:", form);
    const res = await registerUser(form.username, form.password);
    console.log("Register response:", res);
    if (res.token && res.user) {
      localStorage.setItem('jwt', res.token);
      localStorage.setItem('username', res.user.username);
      if (setUser) {
        console.log("Setting user in state:", res.user.username);
        setUser(res.user.username);
      }
      if (setToken) {
        console.log("Setting token in state");
        setToken(res.token);
      }
      console.log("Navigating to /dashboard...");
      navigate('/dashboard');
    } else {
      console.log("Registration failed:", res.errorMessage);
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
