import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt');
    const savedUser = localStorage.getItem('username');
    console.log("Loaded from localStorage → token:", savedToken, "username:", savedUser);
    setToken(savedToken);
    setUsername(savedUser);
  }, []);

  return (
    <BrowserRouter>
      <nav style={{ marginBottom: '1rem' }}>
        <Link to="/">Home</Link> |{" "}
        {!token && <><Link to="/login">Login</Link> | <Link to="/register">Register</Link> |{" "}</>}
        {token && <>
          <Link to="/dashboard">Dashboard</Link> |{" "}
          <button onClick={logout} style={{ cursor: 'pointer' }}>Logout</button> |{" "}
          <span>Hello, {username}!</span>
        </>}
      </nav>
      <Routes>
        <Route path="/" element={<h2>Welcome to AVARC</h2>} />
        <Route path="/login" element={<Login setUser={setUsername} setToken={setToken} />} />
        <Route path="/register" element={<Register setUser={setUsername} setToken={setToken} />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
