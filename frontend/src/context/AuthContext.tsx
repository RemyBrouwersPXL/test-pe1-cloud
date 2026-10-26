import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, NotificationItem } from '../types';
import { authApi, notificationApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.getNotifications(user.id);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      refreshNotifications();

      // Setup Server-Sent Events (SSE) stream for live outbid and win alerts
      const eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type && payload.type !== 'CONNECTED') {
            setNotifications((prev) => [payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        } catch (_) {}
      };

      return () => {
        eventSource.close();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refreshNotifications]);

  const login = async (u: string, p: string) => {
    const res = await authApi.login(u, p);
    setUser(res.user);
  };

  const register = async (payload: any) => {
    const res = await authApi.register(payload);
    setUser(res.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markNotificationRead = async (id: number) => {
    await notificationApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
