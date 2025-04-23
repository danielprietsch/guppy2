
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
  document.body.innerHTML = '<div id="root"></div>';
  const newRootElement = document.getElementById("root");
  if (newRootElement) {
    createRoot(newRootElement).render(<App />);
  }
} else {
  createRoot(rootElement).render(<App />);
}
