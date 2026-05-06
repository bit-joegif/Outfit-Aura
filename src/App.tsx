/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Wardrobe } from './pages/Wardrobe';
import { Outfits } from './pages/Outfits';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f0]">
        <Loader2 className="w-12 h-12 text-[#5A5A40] animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/wardrobe"
          element={user ? <Layout user={user}><Wardrobe /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/outfits"
          element={user ? <Layout user={user}><Outfits /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/calendar"
          element={user ? <Layout user={user}><Calendar /></Layout> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}
