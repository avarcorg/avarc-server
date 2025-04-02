import React, { useState } from 'react';
import { registerUser } from '../../services/authService';

function Register() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleRegister = async () => {
    await registerUser(form.username, form.password);
    alert("Registered successfully!");
  };

  return (
    <div>
      <h3>Register</h3>
      <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;
