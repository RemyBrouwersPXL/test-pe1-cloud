import React from 'react';
import { X, Bell, Check, Clock, TrendingUp, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAuction: (auctionId: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAuction,
}) => {
  const { user, notifications, unreadCount, markNotificationRead, refreshNotifications } = useAuth();

  if (!isOpen) return null;

  const handleMarkAll = async () => {
    if (!user) return;
    try {
      await notificationApi.markAllRead(user.id);
      await refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'OUTBID':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'AUCTION_WON':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Live Notifications</h2>
                <p className="text-xs text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded bg-slate-800 border border-slate-700 transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">Bid alerts and outbid notices will appear here in real time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.is_read) markNotificationRead(item.id);
                    if (item.auction_id) {
                      onSelectAuction(item.auction_id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    !item.is_read
                      ? 'bg-slate-800/90 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className={`text-xs font-bold truncate ${!item.is_read ? 'text-amber-300' : 'text-slate-200'}`}>
                          {item.title}
                        </h3>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-2 block">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
