import React, {useEffect, useState} from 'react';
import config from '../../config/config';
import axios from 'axios';
import {useLocation, useNavigate} from 'react-router-dom';
import LoginHeader from "./LoginHeader";

axios.defaults.withCredentials = true; // Ensure cookies are sent with requests

const LoginWithPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const location = useLocation();
  const initialEmail = location.state?.email || '';

  useEffect(() => {
    if (!initialEmail) {
      navigate('/login/enter-email');
    } else {
      setEmail(initialEmail);
    }
  }, [initialEmail, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = {email, password};

      const response = await axios.post(config.apiUrl + '/auth/login', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response);  // Log the response

      if (response.status === 200) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during login request:', error);  // Log any error
      navigate('/login/enter-email')
    }
  };

  return (<div className="login-container">
    <LoginHeader/>
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={handlePasswordChange}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>);
}

export default LoginWithPassword;
