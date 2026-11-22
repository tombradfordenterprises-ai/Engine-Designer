// [010] Imports React, the DOM renderer, global styles, and the main application component.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// [011] Mounts the single-page engine builder into the HTML root element.
createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
