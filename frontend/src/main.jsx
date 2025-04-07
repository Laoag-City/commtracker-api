import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import App from './App.jsx';
//import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
//note: I used the Bootstrap CDN look in index.html to revert to using above
import '@fortawesome/fontawesome-free/css/all.min.css';

//Read the docs upon upgrading to react-route-dom v7!

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{
      v7_relativeSplatPath: true,
      v7_startTransition: true
    }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
