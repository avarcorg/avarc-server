import React from 'react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>AVARC Authentication</h2>
      <Login />
      <Register />
    </div>
  );
}

export default App;
