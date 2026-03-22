import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../../styles/design-tokens.css';
import '../../styles/side-panel.css';

createRoot(document.getElementById('root')!).render(<App />);
