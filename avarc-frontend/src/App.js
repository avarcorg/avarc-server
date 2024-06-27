import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import config from './config/config';
import './App.css';
import './components/auth/Login.css';
import LoginWithPassword from "./components/auth/LoginWithPassword";
import LoginEnterEmail from "./components/auth/LoginEnterEmail";
import LoginSuccess from './components/auth/LoginSuccess';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<LoginEnterEmail/>}/>
            <Route path="/login/enter-email" element={<LoginEnterEmail/>}/>
            <Route path="/login/with-password" element={<LoginWithPassword/>}/>
            <Route path="/login/success" element={<LoginSuccess/>}/>
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
