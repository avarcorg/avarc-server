import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginEnterEmail() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/login/with-password', { state: { email } });
  };

  return (
    <div>
      <h1>Enter Email</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        <button type="submit">Next</button>
      </form>
    </div>
  );
}

export default LoginEnterEmail;
