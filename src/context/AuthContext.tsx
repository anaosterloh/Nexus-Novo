import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: string | null;
  permissions: Record<string, boolean>;
  hasPermission: (key: string) => boolean;
  loading: boolean;
  login: (userData: User, sessionId: string, perms?: Record<string, boolean>) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  permissions: {},
  hasPermission: () => false,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshMe: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(localStorage.getItem('nexus_session_id'));
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const currentSession = localStorage.getItem('nexus_session_id');
    if (currentSession) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: 'Bearer ' + currentSession }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setPermissions(data.permissions || {});
          setSession(currentSession);
        } else {
          setSession(null);
          setUser(null);
          setPermissions({});
          localStorage.removeItem('nexus_session_id');
        }
      } catch (e) {
        console.error('Error fetching /api/auth/me:', e);
        setSession(null);
        setUser(null);
        setPermissions({});
        localStorage.removeItem('nexus_session_id');
      }
    } else {
      setSession(null);
      setUser(null);
      setPermissions({});
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []); // Remove `session` from dependencies to avoid loop!

  const refreshMe = async () => {
    await initAuth();
  };

  const login = (userData: User, sessionId: string, perms: Record<string, boolean> = {}) => {
    setUser(userData);
    setSession(sessionId);
    setPermissions(perms);
    localStorage.setItem('nexus_session_id', sessionId);
  };

  const logout = async () => {
    if (session) {
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session })
        });
      } catch (e) {}
    }
    setUser(null);
    setSession(null);
    setPermissions({});
    localStorage.removeItem('nexus_session_id');
  };

  const hasPermission = (key: string) => {
    return !!permissions[key];
  };

  return (
    <AuthContext.Provider value={{ user, session, permissions, hasPermission, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
