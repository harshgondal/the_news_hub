import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'local' | 'google';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking authentication...');
      const response = await api.get('/auth/me', {
        timeout: 5000 // 5 second timeout
      });
      console.log('✅ Auth check response:', response.data);
      if (response.data.success) {
        setUser(response.data.data.user);
        console.log('👤 User set:', response.data.data.user);
      }
    } catch (error: any) {
      console.log('❌ Auth check failed:', error.response?.status, error.response?.data);
      if (error.code === 'ECONNABORTED') {
        console.log('⏱️ Request timed out - backend may not be running');
      }
      setUser(null);
    } finally {
      console.log('✅ Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    if (response.data.success) {
      setUser(response.data.data.user);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', { name, email, password });
    if (response.data.success) {
      setUser(response.data.data.user);
    }
  };

  const googleLogin = async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    if (response.data.success) {
      setUser(response.data.data.user);
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, signup, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
