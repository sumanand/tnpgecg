import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db, storage } from '../../firebase/config';
import { ref, get, push, set, query, orderByChild, equalTo, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Briefcase, MapPin, DollarSign, Calendar, Users, CheckCircle, Clock, AlertCircle, Upload, Save, FileText, X } from 'lucide-react';

const PlacementDrives = () => {
  const { currentUser, userData } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal and document upload states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [requiredDocs, setRequiredDocs] = useState({ resume: true });
  const [docUploads, setDocUploads] = useState({
    resume: null,
    transcript: null,
    photo: null,
    collegeId: null
  });
  const [docUrls, setDocUrls] = useState({});
  const [applying, setApplying] = useState(false);

  // Student Form State for dynamically collected details
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    registrationNo: '',
    rollNo: '',
    branch: '',
    class10: '',
    class12: '',
    cgpa: ''
  });

  const branchOptions = [
    'CSE (Ai)',
    'CSE(IOT)',
    'Electrical engineering (EE)',
    'Electronics and communication (vlsi)',
    'mechanical',
    'aeraunatical',
    'civil'
  ];

  useEffect(() => {
    fetchDrives();
    fetchApplications();
  }, [currentUser]);

  const fetchDrives = async () => {
    try {
      const drivesRef = ref(db, 'placement_drives');
      const snapshot = await get(drivesRef);
      const drivesList = [];
      snapshot.forEach((child) => {
        drivesList.push({ id: child.key, ...child.val() });
      });
      // Sort by deadline
      drivesList.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setDrives(drivesList);
    } catch (error) {
      toast.error('Error fetching drives');
    }
  };

  const fetchApplications = async () => {
    try {
      const applicationsRef = query(ref(db, 'applications'), orderByChild('studentId'), equalTo(currentUser.uid));
      const snapshot = await get(applicationsRef);
      const apps = {};
      snapshot.forEach((child) => {
        apps[child.val().driveId] = child.val().status;
      });
      setApplications(apps);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const checkEligibility = (drive) => {
    if (!userData) return false;
    const cgpa = parseFloat(userData.cgpa) || 0;
    const minCgpa = drive.eligibility?.minCGPA || 0;
    const allowedBranches = drive.eligibility?.branches || [];
    
    return cgpa >= minCgpa && (allowedBranches.length === 0 || allowedBranches.includes(userData.branch));
  };

  const handleApplyClick = async (drive) => {
    if (!checkEligibility(drive)) {
      toast.error('You are not eligible for this drive');
      return;
    }

    setLoading(true);
    try {
      const driveDocs = drive.requiredDocs || {
        resume: false,
        transcript: false,
        photo: false,
        collegeId: false
      };
      setRequiredDocs(driveDocs);

      // Pre-populate with existing student details from profile
      setStudentForm({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        registrationNo: userData?.registrationNo || '',
        rollNo: userData?.rollNo || '',
        branch: userData?.branch || '',
        class10: userData?.class10 || '',
        class12: userData?.class12 || '',
        cgpa: userData?.cgpa || ''
      });

      // Pre-populate with existing document URLs from student profile
      const userDocs = userData?.documents || {};
      const urls = {
        resume: userData?.resumeUrl || userDocs.resume || '',
        transcript: userDocs.transcript || '',
        photo: userDocs.photo || '',
        collegeId: userDocs.collegeId || ''
      };
      setDocUrls(urls);
      
      setSelectedDrive(drive);
      setDocUploads({
        resume: null,
        transcript: null,
        photo: null,
        collegeId: null
      });
      setShowApplyModal(true);
    } catch (error) {
      toast.error('Error initializing application requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (docKey, e) => {
    const file = e.target.files[0];
    if (file) {
      if (docKey === 'photo') {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          setDocUploads({ ...docUploads, [docKey]: file });
          toast.success('Passport size photograph selected');
        } else {
          toast.error('Please upload an image or PDF file only');
          e.target.value = '';
        }
      } else {
        if (file.type === 'application/pdf') {
          setDocUploads({ ...docUploads, [docKey]: file });
          toast.success(`${docKey === 'resume' ? 'Resume' : docKey === 'transcript' ? 'Semester Marksheet' : docKey === 'collegeId' ? 'College ID Card' : 'Document'} selected`);
        } else {
          toast.error('Please upload a PDF file only');
          e.target.value = '';
        }
      }
    }
  };

  const handleUploadAndSubmit = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      const updatedUrls = { ...docUrls };
      const studentDocs = { ...(userData?.documents || {}) };

      // Upload required docs if newly selected
      for (const [docKey, isRequired] of Object.entries(requiredDocs)) {
        if (isRequired) {
          const selectedFile = docUploads[docKey];
          
          if (selectedFile) {
            const extension = selectedFile.type === 'application/pdf' ? 'pdf' : selectedFile.name.split('.').pop() || 'jpg';
            const fileRef = storageRef(storage, `student_docs/${currentUser.uid}/${docKey}_${Date.now()}.${extension}`);
            await uploadBytes(fileRef, selectedFile);
            const downloadUrl = await getDownloadURL(fileRef);
            
            updatedUrls[docKey] = downloadUrl;
            studentDocs[docKey] = downloadUrl;

            // Sync main profile resumeUrl
            if (docKey === 'resume') {
              await update(ref(db, `students/${currentUser.uid}`), { resumeUrl: downloadUrl });
            }
          }
        }
      }

      // Sync document mapping & form details in student's profile in database
      const syncProfileData = {
        name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone || '',
        registrationNo: studentForm.registrationNo || '',
        rollNo: studentForm.rollNo || '',
        branch: studentForm.branch || '',
        class10: studentForm.class10 || '',
        class12: studentForm.class12 || '',
        cgpa: studentForm.cgpa || '',
        documents: studentDocs
      };

      if (updatedUrls.resume) {
        syncProfileData.resumeUrl = updatedUrls.resume;
      }

      await update(ref(db, `students/${currentUser.uid}`), syncProfileData);

      // Generate Unique Application ID
      const randomNo = Math.floor(1000 + Math.random() * 9000);
      const companyUpper = (selectedDrive.company || 'COMPANY')
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9-]/g, '');
      const uniqueId = `GECG/${companyUpper}/${randomNo}`;

      // Submit application
      const applicationRef = push(ref(db, 'applications'));
      await set(applicationRef, {
        studentId: currentUser.uid,
        driveId: selectedDrive.id,
        driveType: 'placement',
        status: 'pending',
        appliedAt: new Date().toISOString(),
        uniqueId: uniqueId,
        studentName: studentForm.name,
        studentEmail: studentForm.email,
        studentPhone: studentForm.phone || '',
        studentRegNo: studentForm.registrationNo || '',
        studentRollNo: studentForm.rollNo || '',
        studentBranch: studentForm.branch || '',
        studentClass10: studentForm.class10 || '',
        studentClass12: studentForm.class12 || '',
        studentCgpa: studentForm.cgpa || '',
        resumeUrl: updatedUrls.resume || '',
        documents: updatedUrls
      });

      // Add notification
      const notificationRef = push(ref(db, 'notifications'));
      await set(notificationRef, {
        studentId: currentUser.uid,
        title: 'Application Submitted',
        message: `Your application for ${selectedDrive.title} at ${selectedDrive.company} has been submitted successfully`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });

      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  const getStatusBadge = (driveId) => {
    const status = applications[driveId];
    if (!status) return null;
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      shortlisted: { color: 'bg-blue-100 text-blue-800', icon: Users, text: 'Shortlisted' },
      selected: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Selected' },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Rejected' }
    };
    
    const config = statusConfig[status];
    if (!config) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const filteredDrives = drives.filter(drive => {
    if (filter === 'all') return true;
    if (filter === 'applied') return applications[drive.id];
    if (filter === 'eligible') return checkEligibility(drive);
    if (filter === 'not_applied') return !applications[drive.id];
    return true;
  });

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
        <Header title="Placement Drives" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="mb-6 flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All Drives
              </button>
              <button
                onClick={() => setFilter('eligible')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'eligible' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Eligible
              </button>
              <button
                onClick={() => setFilter('applied')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'applied' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Applied
              </button>
              <button
                onClick={() => setFilter('not_applied')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'not_applied' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Not Applied
              </button>
            </div>

            {/* Drives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrives.map((drive) => {
                const isEligible = checkEligibility(drive);
                const hasApplied = !!applications[drive.id];
                const isDeadlinePassed = new Date(drive.deadline) < new Date();
                
                return (
                  <div key={drive.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{drive.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{drive.company}</p>
                        </div>
                        {getStatusBadge(drive.id)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{drive.location || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="text-sm">CTC: {drive.package || 'Not disclosed'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="text-sm">Vacancies: {drive.vacancies || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eligibility:</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                          <li>Minimum CGPA: {drive.eligibility?.minCGPA || 'Not specified'}</li>
                          <li>Branches: {drive.eligibility?.branches?.join(', ') || 'All branches'}</li>
                        </ul>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!hasApplied && !isDeadlinePassed && (
                          <button
                            onClick={() => handleApplyClick(drive)}
                            disabled={!isEligible}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              isEligible
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Apply Now
                          </button>
                        )}
                        {hasApplied && (
                          <button
                            disabled
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium cursor-not-allowed"
                          >
                            Applied ✓
                          </button>
                        )}
                        {isDeadlinePassed && !hasApplied && (
                          <button
                            disabled
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                          >
                            Deadline Passed
                          </button>
                        )}
                      </div>
                      
                      {!isEligible && !hasApplied && !isDeadlinePassed && (
                        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                          You don't meet the eligibility criteria
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredDrives.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No drives found</h3>
                <p className="text-gray-500 dark:text-gray-500 mt-2">Check back later for new opportunities</p>
              </div>
            )}

            {/* Document Requirements & Application Submission Modal */}
            {showApplyModal && selectedDrive && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150 my-8">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Apply for Placement</h3>
                      <p className="text-xs text-blue-100 mt-1">{selectedDrive.title} at {selectedDrive.company}</p>
                    </div>
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleUploadAndSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {/* Personal & Academic Details Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white border-b pb-2 flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                        Required Profile Information
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name (Always Collected - Read Only) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={studentForm.name}
                            disabled
                            className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            required
                          />
                        </div>

                        {/* Email (Always Collected - Read Only) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={studentForm.email}
                            disabled
                            className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            required
                          />
                        </div>

                        {/* Phone Number */}
                        {(selectedDrive.applicationFields?.phone !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={studentForm.phone}
                              onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                              placeholder="e.g., +91 9876543210"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {/* Registration Number */}
                        {(selectedDrive.applicationFields?.registrationNo !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Registration Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={studentForm.registrationNo}
                              onChange={(e) => setStudentForm({ ...studentForm, registrationNo: e.target.value })}
                              placeholder="e.g., 22GECGCS001"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {/* College Roll Number */}
                        {(selectedDrive.applicationFields?.rollNo !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              College Roll Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={studentForm.rollNo}
                              onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                              placeholder="e.g., 220101"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {/* Branch Select */}
                        {(selectedDrive.applicationFields?.branch !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Branch / Discipline <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={studentForm.branch}
                              onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            >
                              <option value="">Select Branch</option>
                              {branchOptions.map((branch) => (
                                <option key={branch} value={branch}>{branch}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Class 10th Percentage */}
                        {(selectedDrive.applicationFields?.class10 !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Class 10th Marks (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={studentForm.class10}
                              onChange={(e) => setStudentForm({ ...studentForm, class10: e.target.value })}
                              placeholder="e.g., 92.5"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {/* Class 12th / Diploma Percentage */}
                        {(selectedDrive.applicationFields?.class12 !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Class 12th / Diploma Marks (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={studentForm.class12}
                              onChange={(e) => setStudentForm({ ...studentForm, class12: e.target.value })}
                              placeholder="e.g., 88.4"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {/* BTech CGPA */}
                        {(selectedDrive.applicationFields?.cgpa !== false) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Btech CGPA till completion <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={studentForm.cgpa}
                              onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                              placeholder="e.g., 8.75"
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Uploads Section */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white border-b pb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        Application Documents <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">(All uploads are optional)</span>
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(requiredDocs).map(([docKey, isRequired]) => {
                          if (!isRequired) return null;

                          const docLabel = docKey === 'resume' ? 'Resume / CV' : docKey === 'transcript' ? 'Semester Marksheet' : docKey === 'photo' ? 'Passport Size Photograph' : 'College ID Card';
                          const existingUrl = docUrls[docKey];
                          const selectedFile = docUploads[docKey];

                          return (
                            <div key={docKey} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-850 dark:text-white flex items-center">
                                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                  {docLabel} <span className="text-gray-400 dark:text-gray-550 ml-1 font-normal text-xs">(optional)</span>
                                </label>
                                {existingUrl && !selectedFile && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full flex items-center">
                                    Uploaded ✓
                                  </span>
                                )}
                                {selectedFile && (
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full flex items-center">
                                    Selected ✓
                                  </span>
                                )}
                                {!existingUrl && !selectedFile && (
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-750 px-2 py-0.5 rounded-full flex items-center">
                                    Not Uploaded
                                  </span>
                                )}
                              </div>

                              {existingUrl && (
                                <div className="text-xs">
                                  <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                                    View Current Document
                                  </a>
                                </div>
                              )}

                              <input
                                type="file"
                                accept={docKey === 'photo' ? '.pdf,image/*' : '.pdf'}
                                onChange={(e) => handleFileChange(docKey, e)}
                                className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-white cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={applying}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center shadow-md cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(false)}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlacementDrives;