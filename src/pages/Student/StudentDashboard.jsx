import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, Users, CheckCircle, Clock, TrendingUp, Calendar, Eye, XCircle, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    selectedCount: 0,
    upcomingDrives: 0
  });
  const [myApplications, setMyApplications] = useState([]);
  const [recentDrives, setRecentDrives] = useState([]);
  const [placementStats, setPlacementStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      // Fetch applications
      const applicationsRef = query(ref(db, 'applications'), orderByChild('studentId'), equalTo(currentUser.uid));
      const applicationsSnap = await get(applicationsRef);
      const applications = [];
      applicationsSnap.forEach((child) => applications.push({ id: child.key, ...child.val() }));
      
      const pending = applications.filter(app => app.status === 'pending').length;
      const selected = applications.filter(app => app.status === 'selected').length;
      
      // Fetch upcoming drives
      const drivesRef = ref(db, 'placement_drives');
      const drivesSnap = await get(drivesRef);
      const drives = [];
      drivesSnap.forEach((child) => drives.push({ id: child.key, ...child.val() }));
      const upcoming = drives.filter(drive => new Date(drive.deadline) > new Date()).length;
      
      setStats({
        totalApplications: applications.length,
        pendingApplications: pending,
        selectedCount: selected,
        upcomingDrives: upcoming
      });
      
      // Recent drives
      setRecentDrives(drives.slice(0, 5));

      // Resolve drive details for applications dynamically
      const apps = [...applications];
      for (const app of apps) {
        let driveRef;
        if (app.driveType === 'internship') {
          driveRef = ref(db, `internship_drives/${app.driveId}`);
        } else {
          driveRef = ref(db, `placement_drives/${app.driveId}`);
        }
        
        const driveSnapshot = await get(driveRef);
        if (driveSnapshot.exists()) {
          app.driveDetails = driveSnapshot.val();
        }
      }
      apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setMyApplications(apps);
      
      // Placement statistics for chart
      const branchStats = [
        { branch: 'CSE', placed: 85, total: 120 },
        { branch: 'ECE', placed: 72, total: 110 },
        { branch: 'ME', placed: 68, total: 100 },
        { branch: 'CE', placed: 55, total: 90 },
        { branch: 'EE', placed: 60, total: 85 }
      ];
      setPlacementStats(branchStats);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, text: 'Under Review' },
      shortlisted: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye, text: 'Shortlisted' },
      selected: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, text: 'Selected' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, text: 'Not Selected' },
      interview: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Calendar, text: 'Interview Scheduled' }
    };
    return configs[status] || configs.pending;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const statsCards = [
    { title: 'Total Applications', value: stats.totalApplications, icon: Briefcase, color: 'bg-blue-500' },
    { title: 'Pending Review', value: stats.pendingApplications, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Selected', value: stats.selectedCount, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Upcoming Drives', value: stats.upcomingDrives, icon: Calendar, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              Welcome back, {userData?.name || currentUser?.displayName}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your placement journey and stay updated with latest opportunities
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* My Applications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                My Job & Internship Applications
              </h3>
              <Link 
                to="/student/applications" 
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 group transition-colors"
                id="view-all-applications-link"
              >
                View Details
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {myApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max table-auto" id="student-applications-table">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company & Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applied Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {myApplications.slice(0, 5).map((app) => {
                      const statusConfig = getStatusConfig(app.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={app.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white text-base">
                                {app.driveDetails?.company || 'Unknown Company'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {app.driveDetails?.title || 'Applied Position'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shadow-sm ${
                              app.driveType === 'placement'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                                : 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-100 dark:border-teal-800'
                            }`}>
                              {app.driveType === 'placement' ? 'Job' : 'Internship'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 font-mono text-xs border border-gray-200 dark:border-gray-700 shadow-sm">
                              {app.uniqueId || app.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {new Date(app.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                              {statusConfig.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {myApplications.length > 5 && (
                  <div className="mt-4 text-center border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Showing 5 of {myApplications.length} applications. Click "View Details" to see all.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">No applications submitted yet</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Explore available job and internship drives to kickstart your placement journey.
                </p>
                <div className="mt-4 flex gap-4 justify-center">
                  <Link 
                    to="/student/placements"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md"
                  >
                    Job Drives
                  </Link>
                  <Link 
                    to="/student/internships"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-teal-600 dark:bg-teal-500 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-md"
                  >
                    Internship Drives
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Placement Trends</h3>
              <LineChart width={500} height={300} data={placementStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="placed" stroke="#8884d8" />
                <Line type="monotone" dataKey="total" stroke="#82ca9d" />
              </LineChart>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Application Status</h3>
              <PieChart width={500} height={300}>
                <Pie
                  data={[
                    { name: 'Pending', value: stats.pendingApplications },
                    { name: 'Selected', value: stats.selectedCount },
                    { name: 'Rejected', value: stats.totalApplications - stats.pendingApplications - stats.selectedCount }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statsCards.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
          
          {/* Recent Drives */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Placement Drives</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentDrives.map((drive) => (
                    <tr key={drive.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{drive.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{drive.package}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(drive.deadline).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;