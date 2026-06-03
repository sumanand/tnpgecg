import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { FileText, CheckCircle, Clock, XCircle, Eye, Download, Calendar, Briefcase } from 'lucide-react';

const Applications = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [currentUser]);

  const fetchApplications = async () => {
    try {
      const applicationsRef = query(ref(db, 'applications'), orderByChild('studentId'), equalTo(currentUser.uid));
      const snapshot = await get(applicationsRef);
      const apps = [];
      
      snapshot.forEach((child) => {
        apps.push({ id: child.key, ...child.val() });
      });
      
      for (const app of apps) {
        // Fetch drive details
        let driveRef;
        if (app.driveType === 'placement') {
          driveRef = ref(db, `placement_drives/${app.driveId}`);
        } else {
          driveRef = ref(db, `internship_drives/${app.driveId}`);
        }
        
        const driveSnapshot = await get(driveRef);
        if (driveSnapshot.exists()) {
          app.driveDetails = driveSnapshot.val();
        }
      }
      
      // Sort by applied date (newest first)
      apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setApplications(apps);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error fetching applications');
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' },
      shortlisted: { color: 'bg-blue-100 text-blue-800', icon: Eye, text: 'Shortlisted' },
      selected: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Selected' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Not Selected' },
      interview: { color: 'bg-purple-100 text-purple-800', icon: Calendar, text: 'Interview Scheduled' }
    };
    return configs[status] || configs.pending;
  };

  const getStatusSteps = (status) => {
    const steps = ['applied', 'shortlisted', 'interview', 'selected'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      name: step.charAt(0).toUpperCase() + step.slice(1),
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
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
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="My Applications" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{applications.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Shortlisted</p>
                    <p className="text-2xl font-bold text-blue-600">{applications.filter(a => a.status === 'shortlisted').length}</p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Selected</p>
                    <p className="text-2xl font-bold text-green-600">{applications.filter(a => a.status === 'selected').length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Under Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{applications.filter(a => a.status === 'pending').length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-6">
              {applications.map((app) => {
                const StatusIcon = getStatusConfig(app.status).icon;
                return (
                  <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {app.driveDetails?.title || 'Position'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{app.driveDetails?.company}</p>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(app.status).color}`}>
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {getStatusConfig(app.status).text}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Applied on</p>
                          <p className="text-gray-800 dark:text-white">{new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Reference ID</p>
                          <p className="text-gray-800 dark:text-white font-mono text-sm">{app.uniqueId || app.id}</p>
                        </div>
                      </div>
                      
                      {/* Status Timeline */}
                      <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          {getStatusSteps(app.status).map((step, index) => (
                            <div key={index} className="flex-1 relative">
                              <div className={`flex items-center ${index > 0 ? 'ml-[-10px]' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                                }`}>
                                  {step.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                                </div>
                                {index < 3 && (
                                  <div className={`flex-1 h-1 mx-2 ${
                                    step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`} />
                                )}
                              </div>
                              <p className={`text-xs mt-2 ${step.current ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                                {step.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 flex space-x-3">
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            View Resume
                          </a>
                        )}
                        {app.status === 'shortlisted' && (
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {applications.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No applications yet</h3>
                  <p className="text-gray-500 dark:text-gray-500 mt-2">Apply for placement drives to see them here</p>
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
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Application Details</h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{selectedApp.driveDetails?.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                  <p className="text-gray-800 dark:text-white">{selectedApp.driveDetails?.company}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Interview Details</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-1">
                    <p className="text-gray-800 dark:text-white">Your application has been shortlisted. The company will contact you soon with interview schedule.</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Next Steps</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-white mt-1">
                    <li>Prepare for technical interview</li>
                    <li>Keep your documents ready</li>
                    <li>Check email regularly for updates</li>
                    <li>Review company profile and requirements</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;