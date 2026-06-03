import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Briefcase, Award, Calendar, Download, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('2024');
  const [stats, setStats] = useState({
    placementStats: [],
    branchWise: [],
    companyWise: [],
    monthlyTrends: [],
    applicationStats: {}
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [yearFilter]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all students
      const studentsRef = ref(db, 'students');
      const studentsSnap = await get(studentsRef);
      const students = [];
      studentsSnap.forEach((child) => students.push({ id: child.key, ...child.val() }));
      
      // Fetch all applications
      const applicationsRef = ref(db, 'applications');
      const appsSnap = await get(applicationsRef);
      const applications = [];
      appsSnap.forEach((child) => applications.push({ id: child.key, ...child.val() }));
      
      // Fetch all placement drives
      const drivesRef = ref(db, 'placement_drives');
      const drivesSnap = await get(drivesRef);
      const drives = [];
      drivesSnap.forEach((child) => drives.push({ id: child.key, ...child.val() }));
      
      // Calculate placement statistics by branch
      const branchStats = {};
      students.forEach(student => {
        if (!branchStats[student.branch]) {
          branchStats[student.branch] = { total: 0, placed: 0 };
        }
        branchStats[student.branch].total++;
        
        // Check if student is placed (has selected application)
        const studentApps = applications.filter(app => app.studentId === student.id);
        const isPlaced = studentApps.some(app => app.status === 'selected');
        if (isPlaced) {
          branchStats[student.branch].placed++;
        }
      });
      
      const branchWiseData = Object.keys(branchStats).map(branch => ({
        branch,
        total: branchStats[branch].total,
        placed: branchStats[branch].placed,
        percentage: ((branchStats[branch].placed / branchStats[branch].total) * 100).toFixed(1)
      }));
      
      // Calculate company-wise hiring
      const companyStats = {};
      applications.filter(app => app.status === 'selected').forEach(app => {
        const company = app.driveDetails?.company || 'Unknown';
        if (!companyStats[company]) {
          companyStats[company] = 0;
        }
        companyStats[company]++;
      });
      
      const companyWiseData = Object.keys(companyStats).map(company => ({
        company,
        hires: companyStats[company]
      })).sort((a, b) => b.hires - a.hires).slice(0, 10);
      
      // Monthly trends (mock data for demo)
      const monthlyTrendsData = [
        { month: 'Jan', applications: 45, placements: 12 },
        { month: 'Feb', applications: 52, placements: 18 },
        { month: 'Mar', applications: 68, placements: 25 },
        { month: 'Apr', applications: 73, placements: 32 },
        { month: 'May', applications: 85, placements: 38 },
        { month: 'Jun', applications: 92, placements: 45 },
        { month: 'Jul', applications: 88, placements: 42 },
        { month: 'Aug', applications: 95, placements: 48 },
        { month: 'Sep', applications: 78, placements: 35 },
        { month: 'Oct', applications: 82, placements: 40 },
        { month: 'Nov', applications: 70, placements: 30 },
        { month: 'Dec', applications: 60, placements: 25 }
      ];
      
      // Year-wise placement stats
      const placementStatsData = [
        { year: '2020', placed: 180, registered: 250, percentage: 72 },
        { year: '2021', placed: 210, registered: 260, percentage: 80.8 },
        { year: '2022', placed: 245, registered: 270, percentage: 90.7 },
        { year: '2023', placed: 285, registered: 280, percentage: 101.8 },
        { year: '2024', placed: 310, registered: 290, percentage: 106.9 }
      ];
      
      setStats({
        placementStats: placementStatsData,
        branchWise: branchWiseData,
        companyWise: companyWiseData,
        monthlyTrends: monthlyTrendsData,
        applicationStats: {
          total: applications.length,
          pending: applications.filter(a => a.status === 'pending').length,
          shortlisted: applications.filter(a => a.status === 'shortlisted').length,
          selected: applications.filter(a => a.status === 'selected').length,
          rejected: applications.filter(a => a.status === 'rejected').length
        }
      });
      
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching analytics data');
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      year: yearFilter,
      statistics: stats,
      summary: {
        totalPlacementPercentage: ((stats.applicationStats.selected / (stats.applicationStats.total || 1)) * 100).toFixed(1),
        averagePackage: '12.5 LPA',
        topRecruiter: stats.companyWise[0]?.company || 'N/A',
        totalCompanies: stats.companyWise.length
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placement_report_${yearFilter}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Analytics & Reports" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Placement Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Comprehensive insights and statistics</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm shadow-sm"
                >
                  <option value="2024">Year 2024</option>
                  <option value="2023">Year 2023</option>
                  <option value="2022">Year 2022</option>
                  <option value="2021">Year 2021</option>
                </select>
                <button
                  onClick={exportReport}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap"
                >
                  <Download className="w-4 h-4 mr-2 shrink-0" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Overall Placement</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {((stats.applicationStats.selected / (stats.applicationStats.total || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students Placed</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.applicationStats.selected}</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Active Recruiters</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.companyWise.length}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Average Package</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">12.5 LPA</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Year-wise Placement Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Placement Trend Over Years</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.placementStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="placed" stroke="#8884d8" name="Students Placed" />
                    <Line type="monotone" dataKey="registered" stroke="#82ca9d" name="Registered Students" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Branch-wise Placement */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Branch-wise Placement</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.branchWise}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="placed" fill="#8884d8" name="Placed" />
                    <Bar dataKey="total" fill="#82ca9d" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Activity {yearFilter}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#8884d8" name="Applications" />
                    <Line type="monotone" dataKey="placements" stroke="#82ca9d" name="Placements" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Recruiters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Recruiters</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.companyWise}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.company}: ${entry.hires}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hires"
                    >
                      {stats.companyWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Application Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Application Status Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.applicationStats.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.applicationStats.pending}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.applicationStats.shortlisted}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.applicationStats.selected}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Selected</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.applicationStats.rejected}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;