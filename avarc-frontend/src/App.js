import logo from './logo.svg';
import React, { useEffect, useState } from 'react';
import config from './config/config';
import './App.css';

function App() {

  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch( config.apiUrl + '/hello')
      .then(response => response.text())
      .then(data => setMessage(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>

        <h1>ENV: {config.environment}</h1>

        {config.debug && <p>Debug mode is on</p>}

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
