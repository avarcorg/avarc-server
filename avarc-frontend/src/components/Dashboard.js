import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [token] = useState(localStorage.getItem('jwt'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Access denied. No token found.');
    } else {
      setMessage(`Welcome to the protected dashboard, ${username || 'guest'}!`);
    }
  }, [token, username]);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message}</p>
      {!token && (
        <div>
          <p>Please <Link to="/login">Login</Link> or <Link to="/register">Register</Link></p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
