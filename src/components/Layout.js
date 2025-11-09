import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AIAssistant from './AIAssistant';

const Layout = () => {
  return (
    <div className="App">
      <Navbar />
      <div className="container">
        <Outlet />
      </div>
      <AIAssistant />
    </div>
  );
};

export default Layout;
