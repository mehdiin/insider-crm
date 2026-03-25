import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#000' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </StrictMode>,
);
