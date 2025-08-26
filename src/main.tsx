import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSecurityMonitoring } from './utils/security'

// Initialize security monitoring
initSecurityMonitoring();


try {
  const rootElement = document.getElementById("root");
  console.log('main.tsx: Root element found:', rootElement);
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('main.tsx: Root element not found!');
  }
} catch (error) {
  console.error('main.tsx: Error during app initialization:', error);
}
