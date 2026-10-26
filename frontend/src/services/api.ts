import axios from 'axios';
import { Auction, Bid, Comment, User, NotificationItem, InspectionData } from '../types';

export const api = axios.create({
  baseURL: '', // Relative URLs allow Vite proxy in dev and ALB in production
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication
export const authApi = {
  getMe: async (): Promise<{ authenticated: boolean; user: User | null }> => {
    try {
      const res = await api.get('/api/auth/me');
      return res.data;
    } catch {
      return { authenticated: false, user: null };
    }
  },
  login: async (usernameOrEmail: string, password: string): Promise<{ user: User }> => {
    const res = await api.post('/api/auth/login', { usernameOrEmail, password });
    return res.data;
  },
  register: async (payload: { username: string; email: string; password: string; full_name: string; location?: string }): Promise<{ user: User }> => {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },
};

// Auctions
export const auctionApi = {
  getAuctions: async (params?: Record<string, any>): Promise<{ auctions: Auction[]; count: number }> => {
    const res = await api.get('/api/auctions', { params });
    return res.data;
  },
  getAuctionDetail: async (idOrSlug: string | number): Promise<{ auction: Auction; bids: Bid[]; comments: Comment[]; inspection: InspectionData | null }> => {
    const res = await api.get(`/api/auctions/${idOrSlug}`);
    return res.data;
  },
  createAuction: async (payload: any): Promise<{ auction: Auction }> => {
    const res = await api.post('/api/auctions', payload);
    return res.data;
  },
  placeBid: async (auctionId: number, amount: number): Promise<{
    message: string;
    bid: Bid;
    auction: Auction;
    anti_sniping_extended: boolean;
    new_end_time: string;
  }> => {
    const res = await api.post(`/api/auctions/${auctionId}/bid`, { amount });
    return res.data;
  },
  postComment: async (auctionId: number, content: string, parentCommentId?: number): Promise<{ comment: Comment }> => {
    const res = await api.post(`/api/auctions/${auctionId}/comments`, {
      content,
      parent_comment_id: parentCommentId,
    });
    return res.data;
  },
  getStats: async (): Promise<any> => {
    const res = await api.get('/api/auctions/stats');
    return res.data;
  },
};

// Notifications
export const notificationApi = {
  getNotifications: async (userId: number, unreadOnly = false): Promise<{ notifications: NotificationItem[]; unread_count: number }> => {
    const res = await api.get('/api/notifications', {
      params: { userId, unread_only: unreadOnly },
    });
    return res.data;
  },
  markRead: async (id: number): Promise<void> => {
    await api.patch(`/api/notifications/${id}/read`);
  },
  markAllRead: async (userId: number): Promise<void> => {
    await api.post('/api/notifications/read-all', { userId });
  },
};

// Inspections
export const inspectionApi = {
  decodeVin: async (vin: string): Promise<any> => {
    const res = await api.get(`/api/inspections/decode/${vin}`);
    return res.data;
  },
  getReportByVin: async (vin: string): Promise<{ report: InspectionData }> => {
    const res = await api.get(`/api/inspections/reports/${vin}`);
    return res.data;
  },
};
