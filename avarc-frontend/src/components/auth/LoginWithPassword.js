import React, {useEffect, useState} from 'react';
import config from '../../config/config';
import axios from 'axios';
import {useNavigate, useLocation} from 'react-router-dom';

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

      console.log(email);
      console.log(password);

      const data = {email, password};
      console.log('Sending data:', data);  // Log the data being sent

      const response = await axios.post(config.apiUrl + '/auth/login', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response);  // Log the response

      if (response.status === 200) {
        navigate('/login/success');
      }
    } catch (error) {
      console.error('Error during login request:', error);  // Log any error
      navigate('/login/enter-email')
    }
  };

  return (<div className="login-container">
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
