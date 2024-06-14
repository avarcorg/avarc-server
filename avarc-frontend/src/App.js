import logo from './logo.svg';
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {

  const [message, setMessage] = useState('');

  <!-- TODO find a way to configure URL prefixes -->
  useEffect(() => {
    fetch('http://localhost:9696/api/hello')
      .then(response => response.text())
      .then(data => setMessage(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>

        <p>{message}</p>

        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
