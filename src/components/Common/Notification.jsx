import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const Notification = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch(type) {
      case 'success':
        return (
          <div className="p-1.5 bg-green-50 dark:bg-green-500/10 rounded-lg shrink-0">
            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
          </div>
        );
      case 'error':
        return (
          <div className="p-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
          </div>
        );
      default:
        return (
          <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
            <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-gray-200/50 dark:hover:border-indigo-500/15 text-gray-650 dark:text-gray-300 hover:text-blue-600 dark:hover:text-indigo-400 hover:scale-105 active:scale-95 flex items-center justify-center relative"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-300 hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-550 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse border-2 border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 border border-gray-100 dark:border-indigo-500/10 p-2 transform origin-top-right transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-gray-100 dark:border-slate-800/80 mb-1.5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto custom-scrollbar p-1 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center space-y-2">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  <span>No new notifications</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl hover:bg-blue-50/30 dark:hover:bg-indigo-500/5 cursor-pointer transition-all duration-200 border-l-4 ${
                      !notification.read 
                        ? 'bg-blue-500/[0.03] dark:bg-indigo-500/5 border-blue-500 dark:border-indigo-550' 
                        : 'border-transparent'
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Notification;