import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { ref, onValue, query, orderByChild, equalTo, limitToLast, update } from 'firebase/database';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser, userRole, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    let notificationsRef;
    if (userRole === 'student') {
      // Query the last 150 notifications and filter on client to support both personal & broadcast
      notificationsRef = query(
        ref(db, 'notifications'),
        limitToLast(150)
      );
    } else if (userRole === 'admin') {
      notificationsRef = query(
        ref(db, 'notifications'),
        orderByChild('type'),
        equalTo('broadcast'),
        limitToLast(50)
      );
    } else if (userRole === 'company') {
      notificationsRef = query(
        ref(db, 'notifications'),
        orderByChild('type'),
        equalTo('broadcast'),
        limitToLast(50)
      );
    } else {
      return;
    }

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notificationsList = [];
      snapshot.forEach((child) => {
        const val = child.val();
        if (!val) return; // Safeguard against null/empty entries
        
        if (userRole === 'student') {
          const isPersonal = val.studentId === currentUser.uid;
          const isBroadcast = val.type === 'broadcast' && 
            (val.target === 'all' || (val.target === 'branch' && val.targetBranch === userData?.branch));
          
          if (isPersonal || isBroadcast) {
            notificationsList.push({ id: child.key, ...val });
          }
        } else {
          notificationsList.push({ id: child.key, ...val });
        }
      });
      
      // Sort safely comparing timestamp values, avoiding NaN math
      notificationsList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => n && !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser, userRole, userData]);

  const markAsRead = async (notificationId) => {
    try {
      await update(ref(db, `notifications/${notificationId}`), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updates = {};
      notifications.forEach(notification => {
        if (!notification.read) {
          updates[`notifications/${notification.id}/read`] = true;
        }
      });
      await update(ref(db), updates);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Error marking notifications');
    }
  };

  const showNotification = (message, type = 'info') => {
    toast[type](message, {
      duration: 4000,
      position: 'top-right',
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      showNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};