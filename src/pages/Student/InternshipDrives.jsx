import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db, storage } from '../../firebase/config';
import { ref, get, push, set, query, orderByChild, equalTo, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { GraduationCap, MapPin, Calendar, Clock, Users, CheckCircle, AlertCircle, Briefcase, Upload, Save, FileText, X } from 'lucide-react';

const InternshipDrives = () => {
  const { currentUser, userData } = useAuth();
  const [internships, setInternships] = useState([]);
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
    fetchInternships();
    fetchApplications();
  }, [currentUser]);

  const fetchInternships = async () => {
    try {
      const internshipsRef = ref(db, 'internship_drives');
      const snapshot = await get(internshipsRef);
      const internshipsList = [];
      snapshot.forEach((child) => {
        internshipsList.push({ id: child.key, ...child.val() });
      });
      internshipsList.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setInternships(internshipsList);
    } catch (error) {
      toast.error('Error fetching internships');
    }
  };

  const fetchApplications = async () => {
    try {
      const applicationsRef = query(ref(db, 'applications'), orderByChild('studentId'), equalTo(currentUser.uid));
      const snapshot = await get(applicationsRef);
      const apps = {};
      snapshot.forEach((child) => {
        if (child.val().driveType === 'internship') {
          apps[child.val().driveId] = child.val().status;
        }
      });
      setApplications(apps);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const checkEligibility = (internship) => {
    if (!userData) return false;
    const cgpa = parseFloat(userData.cgpa) || 0;
    const minCgpa = internship.eligibility?.minCGPA || 0;
    const allowedBranches = internship.eligibility?.branches || [];
    const currentYear = new Date().getFullYear();
    const isPassingYearValid = userData.passingYear && parseInt(userData.passingYear) >= currentYear;
    
    return cgpa >= minCgpa && 
           (allowedBranches.length === 0 || allowedBranches.includes(userData.branch)) &&
           isPassingYearValid;
  };

  const handleApplyClick = async (internship) => {
    if (!checkEligibility(internship)) {
      toast.error('You are not eligible for this internship');
      return;
    }

    setLoading(true);
    try {
      const driveDocs = internship.requiredDocs || {
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
      
      setSelectedDrive(internship);
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
      const uniqueId = `GECG/INTERN/${randomNo}`;

      // Submit application
      const applicationRef = push(ref(db, 'applications'));
      await set(applicationRef, {
        studentId: currentUser.uid,
        driveId: selectedDrive.id,
        driveType: 'internship',
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

  const getDurationText = (duration) => {
    if (duration === 1) return '1 month';
    if (duration < 12) return `${duration} months`;
    return `${duration / 12} year${duration / 12 > 1 ? 's' : ''}`;
  };

  const filteredInternships = internships.filter(internship => {
    if (filter === 'all') return true;
    if (filter === 'applied') return applications[internship.id];
    if (filter === 'eligible') return checkEligibility(internship);
    if (filter === 'not_applied') return !applications[internship.id];
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
        <Header title="Internship Drives" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Internship Opportunities</h2>
              <p className="text-gray-600 dark:text-gray-400">Kickstart your career with industry experience</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { value: 'all', label: 'All Internships' },
                { value: 'eligible', label: 'Eligible' },
                { value: 'applied', label: 'Applied' },
                { value: 'not_applied', label: 'Not Applied' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === f.value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Internships Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInternships.map((internship) => {
                const isEligible = checkEligibility(internship);
                const hasApplied = !!applications[internship.id];
                const isDeadlinePassed = new Date(internship.deadline) < new Date();
                
                return (
                  <div key={internship.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="relative">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                        <GraduationCap className="w-8 h-8 text-white mb-2" />
                        <h3 className="text-xl font-semibold text-white">{internship.title}</h3>
                        <p className="text-purple-100">{internship.company}</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{internship.location || 'Remote/Office'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm">Duration: {getDurationText(internship.duration)}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">Deadline: {new Date(internship.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span className="text-sm">Stipend: {internship.stipend || 'Unpaid'}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eligibility:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                          <li>Minimum CGPA: {internship.eligibility?.minCGPA || 'Not specified'}</li>
                          <li>Branches: {internship.eligibility?.branches?.join(', ') || 'All branches'}</li>
                          <li>Year: {internship.eligibility?.year || 'Pre-final/Final year'}</li>
                        </ul>
                      </div>
                      
                      {internship.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {internship.description}
                        </p>
                      )}
                      
                      <button
                        onClick={() => handleApplyClick(internship)}
                        disabled={!isEligible || hasApplied || isDeadlinePassed}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${
                          !isEligible || hasApplied || isDeadlinePassed
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                        }`}
                      >
                        {hasApplied ? 'Applied ✓' : 
                         isDeadlinePassed ? 'Deadline Passed' : 
                         !isEligible ? 'Not Eligible' : 'Apply Now'}
                      </button>
                      
                      {!isEligible && !hasApplied && !isDeadlinePassed && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400 text-center">
                          You don't meet the eligibility criteria
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredInternships.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No internships found</h3>
                <p className="text-gray-500 dark:text-gray-500 mt-2">Check back later for new opportunities</p>
              </div>
            )}

            {/* Document Requirements & Application Submission Modal */}
            {showApplyModal && selectedDrive && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150 my-8">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">Apply for Internship</h3>
                      <p className="text-xs text-purple-100 mt-1">{selectedDrive.title} at {selectedDrive.company}</p>
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
                        <GraduationCap className="w-4 h-4 mr-2 text-purple-500" />
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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
                              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Uploads Section */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white border-b pb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-purple-500" />
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
                                  <FileText className="w-4 h-4 mr-2 text-purple-500" />
                                  {docLabel} <span className="text-gray-400 dark:text-gray-550 ml-1 font-normal text-xs">(optional)</span>
                                </label>
                                {existingUrl && !selectedFile && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full flex items-center">
                                    Uploaded ✓
                                  </span>
                                )}
                                {selectedFile && (
                                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full flex items-center">
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
                                  <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center">
                                    View Current Document
                                  </a>
                                </div>
                              )}

                              <input
                                type="file"
                                accept={docKey === 'photo' ? '.pdf,image/*' : '.pdf'}
                                onChange={(e) => handleFileChange(docKey, e)}
                                className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-gray-700 dark:file:text-white cursor-pointer"
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
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center shadow-md cursor-pointer transition-all"
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

export default InternshipDrives;