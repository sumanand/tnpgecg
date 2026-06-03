import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from '../Common/DarkModeToggle';
import Notification from '../Common/Notification';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { logoutUser } from '../../firebase/auth';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Header = ({ title }) => {
  const { currentUser, userData, userRole } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error('Error logging out');
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/75 dark:bg-slate-900/70 border-b border-gray-200/50 dark:border-indigo-500/10 shadow-[0_2px_15px_-3px_rgba(99,102,241,0.02),0_10px_30px_-2px_rgba(0,0,0,0.02)] pl-16 pr-6 py-4 md:px-8 transition-all duration-300 relative">
      {/* Decorative top ambient light bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 opacity-80 dark:opacity-100" />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          {title}
        </h1>
        
        <div className="flex items-center space-x-3.5">
          <DarkModeToggle />
          <Notification />
          
          <div className="h-5 w-px bg-gray-200/60 dark:bg-indigo-500/15 mx-1 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 focus:outline-none group p-1 pr-2 rounded-full hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-all duration-350"
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-600 rounded-full flex items-center justify-center ring-2 ring-blue-500/10 dark:ring-indigo-500/20 group-hover:ring-blue-500/30 dark:group-hover:ring-indigo-500/40 shadow-sm transition-all duration-300 transform group-hover:scale-105">
                <User className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-wide transition-colors group-hover:text-blue-600 dark:group-hover:text-indigo-400">
                  {userData?.name || currentUser?.displayName || 'User'}
                </p>
                <p className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-indigo-400 uppercase mt-0.5">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300 hidden md:block" />
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-3 w-56 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 border border-gray-100 dark:border-indigo-500/10 p-2 transform origin-top-right transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800/80 mb-1.5">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">{userData?.name || currentUser?.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(`/${userRole}/profile`);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-indigo-500/10 hover:text-blue-600 dark:hover:text-indigo-400 rounded-xl flex items-center transition-all duration-200 group"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-450 transition-colors group-hover:text-blue-600 dark:group-hover:text-indigo-400" />
                    My Profile
                  </button>
                  
                  <div className="h-px bg-gray-100 dark:bg-slate-800/80 my-1.5" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center transition-all duration-200 group"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-red-500 transition-colors group-hover:text-red-600" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;