import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, update } from 'firebase/database';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, TrendingUp, Award, Calendar, CheckCircle, FileText, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalPlaced: 0,
    activeDrives: 0
  });
  const [placementTrends, setPlacementTrends] = useState([]);
  const [branchWiseStats, setBranchWiseStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requiredDocs, setRequiredDocs] = useState({
    resume: true,
    coverLetter: false,
    collegeId: false,
    transcript: false
  });
  const [gdriveScriptUrl, setGdriveScriptUrl] = useState('');
  const [savingDocs, setSavingDocs] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val.required_documents) {
          setRequiredDocs({
            resume: true,
            coverLetter: !!val.required_documents.coverLetter,
            collegeId: !!val.required_documents.collegeId,
            transcript: !!val.required_documents.transcript
          });
        }
        if (val.google_drive_script_url) {
          setGdriveScriptUrl(val.google_drive_script_url);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSavingDocs(true);
    try {
      await update(ref(db, 'settings'), {
        required_documents: requiredDocs,
        google_drive_script_url: gdriveScriptUrl
      });
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error updating settings');
    } finally {
      setSavingDocs(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch students count
      const studentsRef = ref(db, 'students');
      const studentsSnap = await get(studentsRef);
      const totalStudents = studentsSnap.size;
      
      // Fetch companies count
      const companiesRef = ref(db, 'companies');
      const companiesSnap = await get(companiesRef);
      const totalCompanies = companiesSnap.size;
      
      // Fetch placement drives
      const drivesRef = ref(db, 'placement_drives');
      const drivesSnap = await get(drivesRef);
      const activeDrives = drivesSnap.size;
      
      setStats({
        totalStudents,
        totalCompanies,
        totalPlaced: 245,
        activeDrives
      });
      
      // Placement trends data
      setPlacementTrends([
        { year: '2020', placed: 180, registered: 250 },
        { year: '2021', placed: 210, registered: 260 },
        { year: '2022', placed: 245, registered: 270 },
        { year: '2023', placed: 285, registered: 280 },
        { year: '2024', placed: 310, registered: 290 }
      ]);
      
      // Branch wise statistics
      setBranchWiseStats([
        { branch: 'CSE', placed: 95, total: 120, percentage: 79 },
        { branch: 'ECE', placed: 82, total: 110, percentage: 75 },
        { branch: 'ME', placed: 78, total: 100, percentage: 78 },
        { branch: 'CE', placed: 65, total: 90, percentage: 72 },
        { branch: 'EE', placed: 70, total: 85, percentage: 82 }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const statsCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { title: 'Total Companies', value: stats.totalCompanies, icon: Briefcase, color: 'bg-green-500', change: '+8%' },
    { title: 'Students Placed', value: stats.totalPlaced, icon: Award, color: 'bg-purple-500', change: '+15%' },
    { title: 'Active Drives', value: stats.activeDrives, icon: Calendar, color: 'bg-orange-500', change: '+5%' }
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
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Admin Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Placement Overview</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor and manage placement activities</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{stat.value}</p>
                    <p className="text-green-500 text-sm mt-1">{stat.change} from last month</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Placement Trends Over Years</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={placementTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="placed" stroke="#8884d8" name="Placed Students" />
                    <Line type="monotone" dataKey="registered" stroke="#82ca9d" name="Registered Students" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Branch-wise Placement</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchWiseStats}>
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
            </div>
          </div>
          
          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Placement Percentage by Branch</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={branchWiseStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.branch}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {branchWiseStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Recruiters</h3>
              <div className="space-y-4">
                {['Google', 'Microsoft', 'Amazon', 'Goldman Sachs', 'Adobe'].map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{company}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{Math.floor(Math.random() * 30) + 10} hires</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Activities Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activities</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { activity: 'New placement drive added', user: 'Admin', time: '2 hours ago', status: 'Completed' },
                    { activity: 'Student application submitted', user: 'John Doe', time: '3 hours ago', status: 'Pending' },
                    { activity: 'Company registered', user: 'Tech Corp', time: '5 hours ago', status: 'Approved' },
                    { activity: 'Resume uploaded', user: 'Jane Smith', time: '1 day ago', status: 'Completed' }
                  ].map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{activity.activity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{activity.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{activity.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Requirements Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Required Application Documents</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Select the documents that students must upload when applying for a placement/internship drive.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingDocs}
                className="px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:opacity-50 self-start md:self-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingDocs ? 'Saving...' : 'Save Requirements'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Resume */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3.5">
                <input
                  type="checkbox"
                  checked={requiredDocs.resume}
                  disabled
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed"
                />
                <div>
                  <label className="font-bold text-gray-800 dark:text-white block text-sm">Resume / CV</label>
                  <span className="text-xs text-gray-500 block mt-1">Always Required (Forced)</span>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3.5 hover:shadow-sm transition-shadow">
                <input
                  type="checkbox"
                  id="coverLetterCheck"
                  checked={requiredDocs.coverLetter}
                  onChange={(e) => setRequiredDocs({ ...requiredDocs, coverLetter: e.target.checked })}
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="coverLetterCheck" className="font-bold text-gray-800 dark:text-white block text-sm cursor-pointer">Cover Letter</label>
                  <span className="text-xs text-gray-500 block mt-1">Standard Cover Letter PDF</span>
                </div>
              </div>

              {/* College ID Card */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3.5 hover:shadow-sm transition-shadow">
                <input
                  type="checkbox"
                  id="collegeIdCheck"
                  checked={requiredDocs.collegeId}
                  onChange={(e) => setRequiredDocs({ ...requiredDocs, collegeId: e.target.checked })}
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="collegeIdCheck" className="font-bold text-gray-800 dark:text-white block text-sm cursor-pointer">College ID Card</label>
                  <span className="text-xs text-gray-500 block mt-1">Student ID PDF</span>
                </div>
              </div>

              {/* CGPA Transcript */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3.5 hover:shadow-sm transition-shadow">
                <input
                  type="checkbox"
                  id="transcriptCheck"
                  checked={requiredDocs.transcript}
                  onChange={(e) => setRequiredDocs({ ...requiredDocs, transcript: e.target.checked })}
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="transcriptCheck" className="font-bold text-gray-800 dark:text-white block text-sm cursor-pointer">CGPA Marksheet</label>
                  <span className="text-xs text-gray-500 block mt-1">Semester Transcript PDF</span>
                </div>
              </div>
            </div>

            {/* Google Drive Apps Script URL Configuration */}
            <div className="mt-8 pt-6 border-t border-gray-250/20 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5 mb-2.5">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-650 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <label className="font-extrabold text-gray-800 dark:text-white text-base">Google Drive Resume Uploader Endpoint</label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed max-w-3xl">
                Paste your deployed Google Apps Script Web App URL below to enable authenticated students to upload their resumes directly to your Google Drive folder for free. If empty, the system automatically falls back to Firebase Storage!
              </p>
              <input
                type="url"
                value={gdriveScriptUrl}
                onChange={(e) => setGdriveScriptUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="e.g. https://script.google.com/macros/s/AKfycb.../exec"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;