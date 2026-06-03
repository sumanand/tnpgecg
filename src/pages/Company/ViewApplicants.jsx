import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Users, Eye, CheckCircle, XCircle, Download, Filter, Search, Mail, Phone, MapPin, GraduationCap } from 'lucide-react';

const ViewApplicants = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('all');

  useEffect(() => {
    fetchCompanyDrives();
  }, [currentUser]);

  const fetchCompanyDrives = async () => {
    try {
      const placementRef = ref(db, 'placement_drives');
      const placementSnap = await get(placementRef);
      const companyDrives = [];
      
      placementSnap.forEach((child) => {
        const drive = child.val();
        if (drive.companyId === currentUser.uid) {
          companyDrives.push({ id: child.key, ...drive, type: 'placement' });
        }
      });
      
      const internshipRef = ref(db, 'internship_drives');
      const internshipSnap = await get(internshipRef);
      internshipSnap.forEach((child) => {
        const drive = child.val();
        if (drive.companyId === currentUser.uid) {
          companyDrives.push({ id: child.key, ...drive, type: 'internship' });
        }
      });
      
      setDrives(companyDrives);
      if (companyDrives.length > 0) {
        fetchApplications(companyDrives[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error('Error fetching drives');
      setLoading(false);
    }
  };

  const fetchApplications = async (driveId) => {
    setLoading(true);
    try {
      const applicationsRef = query(ref(db, 'applications'), orderByChild('driveId'), equalTo(driveId));
      const snapshot = await get(applicationsRef);
      const apps = [];
      
      snapshot.forEach((child) => {
        apps.push({ id: child.key, ...child.val() });
      });
      
      for (const app of apps) {
        // Fetch student details
        const studentRef = ref(db, `students/${app.studentId}`);
        const studentSnap = await get(studentRef);
        if (studentSnap.exists()) {
          app.studentDetails = studentSnap.val();
        }
      }
      
      apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setApplications(apps);
      setFilteredApps(apps);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error fetching applications');
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = applications;
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.studentDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentDetails?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApps(filtered);
  }, [searchTerm, statusFilter, applications]);

  const updateStatus = async (appId, newStatus) => {
    try {
      await update(ref(db, `applications/${appId}`), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Application ${newStatus} successfully`);
      if (selectedDrive !== 'all') {
        fetchApplications(selectedDrive);
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    selected: applications.filter(a => a.status === 'selected').length
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="company" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="View Applicants" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Drive Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Drive
              </label>
              <select
                value={selectedDrive}
                onChange={(e) => {
                  setSelectedDrive(e.target.value);
                  if (e.target.value !== 'all') {
                    fetchApplications(e.target.value);
                  }
                }}
                className="w-full md:w-96 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Drives</option>
                {drives.map(drive => (
                  <option key={drive.id} value={drive.id}>
                    {drive.title} - {drive.type === 'placement' ? 'Placement' : 'Internship'}
                  </option>
                ))}
              </select>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Review</p>
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
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
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
              </div>
            </div>

            {/* Applicants List */}
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex flex-wrap items-center gap-2">
                            {app.studentDetails?.name || app.studentName}
                            {app.uniqueId && (
                              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-md shadow-sm">
                                {app.uniqueId}
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-650 dark:text-gray-400 text-sm">
                            Roll No: {app.studentDetails?.rollNo || app.studentRollNo || 'N/A'}
                            {(app.studentDetails?.registrationNo || app.studentRegNo) && ` | Reg No: ${app.studentDetails?.registrationNo || app.studentRegNo}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {app.studentDetails?.branch || app.studentBranch} | CGPA: {app.studentDetails?.cgpa || app.studentCgpa}
                            </span>
                          </div>
                          {(app.studentDetails?.class10 || app.studentClass10) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              Class 10th Marks: {app.studentDetails?.class10 || app.studentClass10}%
                            </div>
                          )}
                          {(app.studentDetails?.class12 || app.studentClass12) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              Class 12th/Diploma Marks: {app.studentDetails?.class12 || app.studentClass12}%
                            </div>
                          )}
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="text-sm">{app.studentDetails?.email || app.studentEmail}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="text-sm">{app.studentDetails?.phone || app.studentPhone || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.studentDetails?.skills?.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {app.studentDetails?.skills?.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                                +{app.studentDetails.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                        
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Resume
                          </a>
                        )}
                        
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'shortlisted')}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Shortlist
                            </button>
                            <button
                              onClick={() => updateStatus(app.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        
                        {app.status === 'shortlisted' && (
                          <button
                            onClick={() => updateStatus(app.id, 'selected')}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Select for Offer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredApps.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No applicants found</h3>
                  <p className="text-gray-500 dark:text-gray-500 mt-2">When students apply, they will appear here</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Applicant Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Applicant Details</h3>
                <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Personal & Academic Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p><span className="text-gray-500 font-medium">Name:</span> {selectedApp.studentDetails?.name || selectedApp.studentName}</p>
                    <p><span className="text-gray-500 font-medium">Email:</span> {selectedApp.studentDetails?.email || selectedApp.studentEmail}</p>
                    <p><span className="text-gray-500 font-medium">Phone:</span> {selectedApp.studentDetails?.phone || selectedApp.studentPhone || 'N/A'}</p>
                    <p><span className="text-gray-500 font-medium">Branch:</span> {selectedApp.studentDetails?.branch || selectedApp.studentBranch}</p>
                    <p><span className="text-gray-500 font-medium">Roll No:</span> {selectedApp.studentDetails?.rollNo || selectedApp.studentRollNo || 'N/A'}</p>
                    <p><span className="text-gray-500 font-medium">Registration No:</span> {selectedApp.studentDetails?.registrationNo || selectedApp.studentRegNo || 'N/A'}</p>
                    <p><span className="text-gray-500 font-medium">BTech CGPA:</span> {selectedApp.studentDetails?.cgpa || selectedApp.studentCgpa}</p>
                    <p><span className="text-gray-500 font-medium">Class 10th Marks:</span> {selectedApp.studentDetails?.class10 || selectedApp.studentClass10 || 'N/A'}%</p>
                    <p><span className="text-gray-500 font-medium">Class 12th/Diploma:</span> {selectedApp.studentDetails?.class12 || selectedApp.studentClass12 || 'N/A'}%</p>
                    {selectedApp.studentDetails?.skills && (
                      <p className="col-span-2"><span className="text-gray-500 font-medium">Skills:</span> {selectedApp.studentDetails.skills.join(', ')}</p>
                    )}
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Application Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-500 font-medium">Reference ID:</span> <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedApp.uniqueId || 'N/A'}</span></p>
                    <p><span className="text-gray-500 font-medium">Applied Date:</span> {new Date(selectedApp.appliedAt).toLocaleDateString()}</p>
                    <p className="col-span-2"><span className="text-gray-500 font-medium">Status:</span> 
                      <span className={`ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(selectedApp.status)}`}>
                        {selectedApp.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Submitted Documents Section */}
                {selectedApp.documents && Object.keys(selectedApp.documents).length > 0 && (
                  <div className="border-b pb-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Submitted Documents</h4>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(selectedApp.documents).map(([docKey, url]) => {
                        if (!url) return null;
                        const label = docKey === 'resume' ? 'Resume / CV' : docKey === 'transcript' ? 'Semester Marksheet' : docKey === 'photo' ? 'Passport Photograph' : 'College ID Card';
                        return (
                          <a
                            key={docKey}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-750 dark:text-blue-300 text-xs font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            {label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  {selectedApp.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updateStatus(selectedApp.id, 'shortlisted');
                          setSelectedApp(null);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => {
                          updateStatus(selectedApp.id, 'rejected');
                          setSelectedApp(null);
                        }}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedApp.status === 'shortlisted' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedApp.id, 'selected');
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                    >
                      Select for Offer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;