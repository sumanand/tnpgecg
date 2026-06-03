import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../firebase/auth';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Bell,
  History,
  CheckCircle,
  LogOut,
  Users,
  BarChart,
  Calendar,
  Settings,
  Send,
  FileCheck,
  TrendingUp,
  Building,
  UploadCloud,
  UserPlus,
  UserCheck,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    // Set initial responsive state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error('Error logging out');
    }
  };

  const studentMenuItems = [
    { path: '/student', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/profile', name: 'My Profile', icon: User },
    { path: '/student/placements', name: 'Placement Drives', icon: Briefcase },
    { path: '/student/internships', name: 'Internship Drives', icon: GraduationCap },
    { path: '/student/applications', name: 'My Applications', icon: FileText },
    { path: '/student/eligibility', name: 'Eligibility Checker', icon: CheckCircle },
    { path: '/student/history', name: 'Placement History', icon: History }
  ];

  const adminMenuItems = [
    { path: '/admin', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', name: 'Manage Students', icon: Users },
    { path: '/admin/upload-students', name: 'Upload Students', icon: UserPlus },
    { path: '/admin/companies', name: 'Company Approvals', icon: FileCheck },
    { path: '/admin/recruiters', name: 'Recruiter Partners', icon: Building },
    { path: '/admin/drives', name: 'Manage Drives', icon: Calendar },
    { path: '/admin/applications', name: 'Applications', icon: FileText },
    { path: '/admin/analytics', name: 'Analytics', icon: BarChart },
    { path: '/admin/notices', name: 'Notices', icon: Bell },
    { path: '/admin/reports', name: 'Export Reports', icon: TrendingUp },
    { path: '/admin/upload-placements', name: 'Upload Placements', icon: UploadCloud },
    { path: '/admin/team', name: 'Manage Team', icon: UserCheck }
  ];

  const companyMenuItems = [
    { path: '/company', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/company/post-job', name: 'Post Job', icon: Send },
    { path: '/company/post-internship', name: 'Post Internship', icon: GraduationCap },
    { path: '/company/applicants', name: 'View Applicants', icon: Users },
    { path: '/company/shortlist', name: 'Shortlist', icon: FileCheck }
  ];

  const menuItems = role === 'student' ? studentMenuItems : role === 'admin' ? adminMenuItems : companyMenuItems;

  return (
    <>
      {/* Mobile Floating Menu Button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3.5 left-4 z-50 p-2.5 text-gray-700 dark:text-gray-300 md:hidden bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/50 dark:border-indigo-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Dark overlay backdrop on mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto h-screen
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} 
          backdrop-blur-md bg-white/80 dark:bg-slate-900/60 border-r border-gray-200/45 dark:border-indigo-500/10 shadow-lg transition-all duration-300 flex flex-col
        `}
      >
        <div className="p-4 border-b border-gray-200/45 dark:border-indigo-500/10 flex items-center justify-between">
          <div className={`flex items-center space-x-2.5 ${!isOpen && 'justify-center w-full'}`}>
            <div className="bg-white p-0.5 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-md" />
            </div>
            {isOpen && <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">TNP Portal</span>}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <LayoutDashboard className="w-5 h-5 hidden md:block" />
            <X className="w-5 h-5 block md:hidden hover:text-gray-800 dark:hover:text-white" />
          </button>
        </div>
        
        <nav className="flex-1 mt-8 overflow-y-auto custom-scrollbar px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsOpen(false);
                }
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 my-1 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-indigo-500/10 dark:to-violet-500/10 border-l-4 border-blue-600 dark:border-indigo-500 text-blue-600 dark:text-indigo-400 font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                } ${!isOpen && 'justify-center'}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isOpen && <span className="font-semibold text-sm tracking-wide">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200/45 dark:border-indigo-500/10">
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 ${!isOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isOpen && <span className="font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;