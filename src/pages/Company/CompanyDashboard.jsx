import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Briefcase, Users, FileText, TrendingUp, Eye, CheckCircle, Clock, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompanyDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [stats, setStats] = useState({
    totalDrives: 0,
    totalApplications: 0,
    shortlisted: 0,
    selected: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, [currentUser]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company's placement drives
      const placementRef = query(ref(db, 'placement_drives'), orderByChild('companyId'), equalTo(currentUser.uid));
      const placementSnap = await get(placementRef);
      const drives = [];
      placementSnap.forEach((child) => drives.push({ id: child.key, ...child.val() }));
      
      // Fetch company's internship drives
      const internshipRef = query(ref(db, 'internship_drives'), orderByChild('companyId'), equalTo(currentUser.uid));
      const internshipSnap = await get(internshipRef);
      internshipSnap.forEach((child) => drives.push({ id: child.key, ...child.val() }));
      
      // Fetch applications for these drives
      const applications = [];
      for (const drive of drives) {
        const appsRef = query(ref(db, 'applications'), orderByChild('driveId'), equalTo(drive.id));
        const appsSnap = await get(appsRef);
        appsSnap.forEach((child) => {
          const app = { id: child.key, ...child.val(), driveTitle: drive.title };
          applications.push(app);
        });
      }
      
      setStats({
        totalDrives: drives.length,
        totalApplications: applications.length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        selected: applications.filter(a => a.status === 'selected').length
      });
      
      // Recent applications
      setRecentApplications(applications.slice(0, 5));
      
      // Monthly data for chart
      const monthlyApps = {};
      applications.forEach(app => {
        const month = new Date(app.appliedAt).toLocaleString('default', { month: 'short' });
        monthlyApps[month] = (monthlyApps[month] || 0) + 1;
      });
      
      const monthlyChartData = Object.keys(monthlyApps).map(month => ({
        month,
        applications: monthlyApps[month]
      }));
      setMonthlyData(monthlyChartData);
      
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const statsCards = [
    { title: 'Active Drives', value: stats.totalDrives, icon: Briefcase, color: 'bg-blue-500' },
    { title: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'bg-purple-500' },
    { title: 'Shortlisted', value: stats.shortlisted, icon: Eye, color: 'bg-yellow-500' },
    { title: 'Selected', value: stats.selected, icon: CheckCircle, color: 'bg-green-500' }
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
      <Sidebar role="company" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Company Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                Welcome, {userData?.name || currentUser?.displayName}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your recruitment drives and track applications
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
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Application Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="applications" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Application Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{stats.totalApplications - stats.shortlisted - stats.selected}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((stats.totalApplications - stats.shortlisted - stats.selected) / stats.totalApplications || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{stats.shortlisted}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.shortlisted / stats.totalApplications || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Selected</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{stats.selected}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.selected / stats.totalApplications || 0) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Applications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Applications</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Drive</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applied Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{app.driveTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            app.status === 'selected' ? 'bg-green-100 text-green-800' :
                            app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentApplications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No applications received yet</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;