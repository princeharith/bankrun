import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import useAuthStore from './store/authStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const { user, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-press-start">
        LOADING...
      </div>
    );
  }

  return (
    <>
      <div className="scanline"></div>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            // element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
            element={<Login />}
          />
          <Route
            path="/auth/callback"
            element={<AuthCallback />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
