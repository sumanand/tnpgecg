import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, update, query, orderByChild, equalTo, set, push } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Users, CheckCircle, XCircle, Send, Mail, Phone, Calendar, Award } from 'lucide-react';

const ShortlistCandidates = () => {
  const { currentUser } = useAuth();
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    package: '',
    joiningDate: '',
    location: '',
    remarks: ''
  });

  useEffect(() => {
    fetchShortlistedCandidates();
  }, [currentUser]);

  const fetchShortlistedCandidates = async () => {
    try {
      // First get company's drives
      const placementRef = ref(db, 'placement_drives');
      const placementSnap = await get(placementRef);
      const companyDriveIds = [];
      
      placementSnap.forEach((child) => {
        const drive = child.val();
        if (drive.companyId === currentUser.uid) {
          companyDriveIds.push(child.key);
        }
      });
      
      const internshipRef = ref(db, 'internship_drives');
      const internshipSnap = await get(internshipRef);
      internshipSnap.forEach((child) => {
        const drive = child.val();
        if (drive.companyId === currentUser.uid) {
          companyDriveIds.push(child.key);
        }
      });
      
      // Get shortlisted applications
      const candidates = [];
      for (const driveId of companyDriveIds) {
        const appsRef = query(ref(db, 'applications'), orderByChild('driveId'), equalTo(driveId));
        const appsSnap = await get(appsRef);
        const apps = [];
        
        appsSnap.forEach((child) => {
          apps.push({ id: child.key, ...child.val() });
        });
        
        for (const app of apps) {
          if (app.status === 'shortlisted') {
            // Fetch student details
            const studentRef = ref(db, `students/${app.studentId}`);
            const studentSnap = await get(studentRef);
            if (studentSnap.exists()) {
              app.studentDetails = studentSnap.val();
              candidates.push(app);
            }
          }
        }
      }
      
      setShortlistedCandidates(candidates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error);
      toast.error('Error fetching shortlisted candidates');
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === shortlistedCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(shortlistedCandidates.map(c => c.id));
    }
  };

  const sendOfferLetters = async () => {
    if (selectedCandidates.length === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    if (!offerDetails.package || !offerDetails.joiningDate) {
      toast.error('Please fill in offer details');
      return;
    }

    try {
      for (const candidateId of selectedCandidates) {
        const candidate = shortlistedCandidates.find(c => c.id === candidateId);
        
        // Update application status
        await update(ref(db, `applications/${candidateId}`), {
          status: 'selected',
          selectedAt: new Date().toISOString(),
          offerDetails: {
            package: offerDetails.package,
            joiningDate: offerDetails.joiningDate,
            location: offerDetails.location,
            remarks: offerDetails.remarks
          }
        });
        
        // Add to selected students
        const selectedRef = push(ref(db, 'selected_students'));
        await set(selectedRef, {
          studentId: candidate.studentId,
          driveId: candidate.driveId,
          companyId: currentUser.uid,
          companyName: candidate.driveDetails?.company,
          position: candidate.driveDetails?.title,
          package: offerDetails.package,
          joiningDate: offerDetails.joiningDate,
          location: offerDetails.location,
          selectedAt: new Date().toISOString()
        });
        
        // Send notification to student
        const notificationRef = push(ref(db, 'notifications'));
        await set(notificationRef, {
          studentId: candidate.studentId,
          title: 'Congratulations! You have been selected! 🎉',
          message: `You have been selected for ${candidate.driveDetails?.title} position at ${candidate.driveDetails?.company}. Offer letter will be shared soon.`,
          type: 'success',
          createdAt: new Date().toISOString(),
          read: false
        });
      }
      
      toast.success(`Offer letters sent to ${selectedCandidates.length} candidates`);
      setShowOfferModal(false);
      setSelectedCandidates([]);
      setOfferDetails({
        package: '',
        joiningDate: '',
        location: '',
        remarks: ''
      });
      fetchShortlistedCandidates();
    } catch (error) {
      toast.error('Error sending offer letters');
    }
  };

  const sendInterviewInvite = async (candidate) => {
    try {
      // Update status to interview
      await update(ref(db, `applications/${candidate.id}`), {
        status: 'interview',
        interviewScheduled: true,
        updatedAt: new Date().toISOString()
      });
      
      // Send notification
      const notificationRef = push(ref(db, 'notifications'));
      await set(notificationRef, {
        studentId: candidate.studentId,
        title: 'Interview Scheduled',
        message: `You have been shortlisted for interview at ${candidate.driveDetails?.company}. Check your email for details.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false
      });
      
      toast.success('Interview invite sent successfully');
      fetchShortlistedCandidates();
    } catch (error) {
      toast.error('Error sending interview invite');
    }
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
      <Sidebar role="company" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Shortlist Candidates" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Shortlisted Candidates</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  {shortlistedCandidates.length} candidates shortlisted
                </p>
              </div>
              
              {selectedCandidates.length > 0 && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap self-start sm:self-auto animate-pulse"
                >
                  <Send className="w-4 h-4 mr-2 shrink-0 animate-bounce" />
                  Send Offer Letters ({selectedCandidates.length})
                </button>
              )}
            </div>

            {/* Candidates List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === shortlistedCandidates.length && shortlistedCandidates.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Select All</span>
                </label>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {shortlistedCandidates.map((candidate) => (
                  <div key={candidate.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => handleSelectCandidate(candidate.id)}
                        className="w-4 h-4 text-blue-600 rounded mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex flex-wrap items-center gap-2">
                              {candidate.studentDetails?.name || candidate.studentName}
                              {candidate.uniqueId && (
                                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-md shadow-sm">
                                  {candidate.uniqueId}
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-650 dark:text-gray-400 text-sm">
                              Roll No: {candidate.studentDetails?.rollNo || candidate.studentRollNo || 'N/A'}
                              {(candidate.studentDetails?.registrationNo || candidate.studentRegNo) && ` | Reg No: ${candidate.studentDetails?.registrationNo || candidate.studentRegNo}`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => sendInterviewInvite(candidate)}
                              className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                            >
                              Schedule Interview
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {candidate.studentDetails?.branch || candidate.studentBranch} | CGPA: {candidate.studentDetails?.cgpa || candidate.studentCgpa}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="text-sm">{candidate.studentDetails?.email || candidate.studentEmail}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="text-sm">{candidate.studentDetails?.phone || candidate.studentPhone || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.studentDetails?.skills?.map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {shortlistedCandidates.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No shortlisted candidates</h3>
                  <p className="text-gray-500 dark:text-gray-500 mt-2">Shortlist candidates from the applicants list</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Offer Letter Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Award className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Send Offer Letters</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sending offers to {selectedCandidates.length} candidate(s)
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Package / CTC *
                  </label>
                  <input
                    type="text"
                    value={offerDetails.package}
                    onChange={(e) => setOfferDetails({ ...offerDetails, package: e.target.value })}
                    placeholder="e.g., 12 LPA"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    value={offerDetails.joiningDate}
                    onChange={(e) => setOfferDetails({ ...offerDetails, joiningDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={offerDetails.location}
                    onChange={(e) => setOfferDetails({ ...offerDetails, location: e.target.value })}
                    placeholder="Work location"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Remarks
                  </label>
                  <textarea
                    value={offerDetails.remarks}
                    onChange={(e) => setOfferDetails({ ...offerDetails, remarks: e.target.value })}
                    rows={3}
                    placeholder="Any additional information for candidates..."
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={sendOfferLetters}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Send Offers
                </button>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistCandidates;