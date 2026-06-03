import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Eye, CheckCircle, XCircle, Download, Search, UserCheck, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driveFilter, setDriveFilter] = useState('all');
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchDrives();
  }, []);

  const fetchApplications = async () => {
    try {
      const appsRef = ref(db, 'applications');
      const snapshot = await get(appsRef);
      const appsList = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          appsList.push({ id: child.key, ...child.val() });
        });
      }
      
      // Fetch details for each application
      const detailedApps = await Promise.all(
        appsList.map(async (app) => {
          const studentSnap = await get(ref(db, `students/${app.studentId}`));
          const driveSnap = await get(ref(db, `placement_drives/${app.driveId}`));
          const internSnap = !driveSnap.exists() ? await get(ref(db, `internship_drives/${app.driveId}`)) : null;
          
          return {
            ...app,
            studentDetails: studentSnap.val(),
            driveDetails: driveSnap.exists() ? driveSnap.val() : internSnap?.val()
          };
        })
      );
      
      setApplications(detailedApps);
      setFilteredApps(detailedApps);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching applications');
      setLoading(false);
    }
  };

  const fetchDrives = async () => {
    try {
      const [placementsSnap, internshipsSnap] = await Promise.all([
        get(ref(db, 'placement_drives')),
        get(ref(db, 'internship_drives'))
      ]);
      
      const drivesList = [];
      if (placementsSnap.exists()) {
        placementsSnap.forEach(c => drivesList.push({ id: c.key, ...c.val() }));
      }
      if (internshipsSnap.exists()) {
        internshipsSnap.forEach(c => drivesList.push({ id: c.key, ...c.val() }));
      }
      setDrives(drivesList);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let filtered = applications;
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.studentDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentDetails?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.driveDetails?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (driveFilter !== 'all') {
      filtered = filtered.filter(app => app.driveId === driveFilter);
    }
    
    setFilteredApps(filtered);
  }, [searchTerm, statusFilter, driveFilter, applications]);

  const handleStatusUpdate = async (appId, studentId, driveId, newStatus) => {
    try {
      await update(ref(db, `applications/${appId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Update student's application history cache as well
      await update(ref(db, `students/${studentId}/applications/${appId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Application status updated to ${newStatus}`);
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Roll No', 'Branch', 'CGPA', 'Company', 'Position', 'Applied Date', 'Status'];
    const csvData = filteredApps.map(app => [
      app.studentDetails?.name || 'N/A',
      app.studentDetails?.rollNo || 'N/A',
      app.studentDetails?.branch || 'N/A',
      app.studentDetails?.cgpa || 'N/A',
      app.driveDetails?.company || 'N/A',
      app.driveDetails?.title || 'N/A',
      new Date(app.appliedAt).toLocaleDateString(),
      app.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applications_data.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const exportToExcel = () => {
    const data = filteredApps.map(app => ({
      'Student Name': app.studentDetails?.name || 'N/A',
      'Roll No': app.studentDetails?.rollNo || 'N/A',
      Branch: app.studentDetails?.branch || 'N/A',
      CGPA: app.studentDetails?.cgpa || 'N/A',
      Company: app.driveDetails?.company || 'N/A',
      Position: app.driveDetails?.title || 'N/A',
      'Applied Date': new Date(app.appliedAt).toLocaleDateString(),
      Status: app.status || 'N/A',
      Feedback: app.feedback || 'None'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    XLSX.writeFile(workbook, "applications_data.xlsx");
    toast.success('Excel report exported successfully');
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      interview: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.pending;
  };

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
        <Header title="Manage Applications" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Shortlisted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.shortlisted}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Selected</p>
                <p className="text-2xl font-bold text-green-600">{stats.selected}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={driveFilter}
                    onChange={(e) => setDriveFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 max-w-[200px]"
                  >
                    <option value="all">All Drives</option>
                    {drives.map(drive => (
                      <option key={drive.id} value={drive.id}>{drive.title} - {drive.company}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={exportToExcel}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </button>
                  
                  <button
                    onClick={exportToCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Drive Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applied On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{app.studentDetails?.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{app.studentDetails?.rollNo}</div>
                          <div className="text-xs text-gray-400">{app.studentDetails?.branch} | CGPA: {app.studentDetails?.cgpa}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{app.driveDetails?.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{app.driveDetails?.company}</div>
                          <div className="text-xs text-gray-400">{app.driveType === 'placement' ? 'Placement' : 'Internship'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(app.id, 'shortlisted')}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Shortlist"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(app.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {app.status === 'shortlisted' && (
                              <button
                                onClick={() => updateStatus(app.id, 'selected')}
                                className="text-green-600 hover:text-green-900"
                                title="Select"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredApps.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No applications found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Application Details</h3>
                <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedApp.studentDetails?.name}</p>
                    <p><span className="text-gray-500">Roll No:</span> {selectedApp.studentDetails?.rollNo}</p>
                    <p><span className="text-gray-500">Branch:</span> {selectedApp.studentDetails?.branch}</p>
                    <p><span className="text-gray-500">CGPA:</span> {selectedApp.studentDetails?.cgpa}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedApp.studentDetails?.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedApp.studentDetails?.phone}</p>
                    <p className="col-span-2"><span className="text-gray-500">Skills:</span> {selectedApp.studentDetails?.skills?.join(', ')}</p>
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Drive Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-500">Position:</span> {selectedApp.driveDetails?.title}</p>
                    <p><span className="text-gray-500">Company:</span> {selectedApp.driveDetails?.company}</p>
                    <p><span className="text-gray-500">Package:</span> {selectedApp.driveDetails?.package || selectedApp.driveDetails?.stipend}</p>
                    <p><span className="text-gray-500">Location:</span> {selectedApp.driveDetails?.location}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h4>
                  <div className="flex space-x-3">
                    {selectedApp.resumeUrl && (
                      <a
                        href={selectedApp.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700"
                      >
                        View Resume
                      </a>
                    )}
                    <button
                      onClick={() => {
                        updateStatus(selectedApp.id, 'shortlisted');
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Shortlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;