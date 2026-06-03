import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db, storage } from '../../firebase/config';
import { ref, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { User, Mail, Book, Hash, Star, Upload, Save, Briefcase, Code, GraduationCap } from 'lucide-react';

const StudentProfile = () => {
  const { currentUser, userData, setUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    rollNo: '',
    cgpa: '',
    skills: '',
    phone: '',
    email: '',
    passingYear: '',
    registrationNo: '',
    class10: '',
    class12: '',
    resume: null
  });
  const [resumeUrl, setResumeUrl] = useState('');
  const [gdriveScriptUrl, setGdriveScriptUrl] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        branch: userData.branch || '',
        rollNo: userData.rollNo || '',
        cgpa: userData.cgpa || '',
        skills: userData.skills ? userData.skills.join(', ') : '',
        phone: userData.phone || '',
        email: currentUser?.email || '',
        passingYear: userData.passingYear || '',
        registrationNo: userData.registrationNo || '',
        class10: userData.class10 || '',
        class12: userData.class12 || '',
        resume: null
      });
      setResumeUrl(userData.resumeUrl || '');
    }
  }, [userData, currentUser]);

  useEffect(() => {
    const fetchGDriveSettings = async () => {
      try {
        const snapshot = await get(ref(db, 'settings/google_drive_script_url'));
        if (snapshot.exists()) {
          setGdriveScriptUrl(snapshot.val());
        }
      } catch (err) {
        console.warn('Error fetching GDrive settings:', err.message);
      }
    };
    fetchGDriveSettings();
  }, []);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (file && allowedTypes.includes(file.type)) {
      setFormData({ ...formData, resume: file });
      toast.success('Resume file selected: ' + file.name);
    } else {
      toast.error('Please upload a PDF or an Image file (PNG/JPG)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resumeDownloadUrl = resumeUrl;

      // Upload resume if new file selected
      if (formData.resume) {
        if (gdriveScriptUrl) {
          toast.loading('Uploading resume to Google Drive...', { id: 'gdriveUpload' });
          try {
            const base64File = await convertFileToBase64(formData.resume);
            const response = await fetch(gdriveScriptUrl, {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
              },
              body: JSON.stringify({
                uid: currentUser.uid,
                name: formData.resume.name,
                type: formData.resume.type,
                file: base64File
              })
            });
            const resData = await response.json();
            toast.dismiss('gdriveUpload');
            
            if (resData.success) {
              resumeDownloadUrl = resData.directUrl;
              toast.success('Resume uploaded to Google Drive successfully!');
            } else {
              throw new Error(resData.error || 'Failed uploading to Google Drive');
            }
          } catch (uploadErr) {
            toast.dismiss('gdriveUpload');
            console.error('Google Drive upload error:', uploadErr);
            toast.error('Google Drive upload failed. Falling back to Firebase Storage...');
            
            // Graceful fallback to Firebase Storage
            const resumeStorageRef = storageRef(storage, `resumes/${currentUser.uid}/${Date.now()}_${formData.resume.name}`);
            await uploadBytes(resumeStorageRef, formData.resume);
            resumeDownloadUrl = await getDownloadURL(resumeStorageRef);
          }
        } else {
          // Standard Firebase Storage uploader
          const resumeStorageRef = storageRef(storage, `resumes/${currentUser.uid}/${Date.now()}_${formData.resume.name}`);
          await uploadBytes(resumeStorageRef, formData.resume);
          resumeDownloadUrl = await getDownloadURL(resumeStorageRef);
        }
      }

      // Update student data in database
      const studentRef = ref(db, `students/${currentUser.uid}`);
      const updatedData = {
        name: formData.name,
        branch: formData.branch,
        rollNo: formData.rollNo,
        cgpa: parseFloat(formData.cgpa) || 0,
        skills: formData.skills.split(',').map(skill => skill.trim()),
        phone: formData.phone,
        passingYear: formData.passingYear,
        registrationNo: formData.registrationNo,
        class10: formData.class10 ? parseFloat(formData.class10) : '',
        class12: formData.class12 ? parseFloat(formData.class12) : '',
        resumeUrl: resumeDownloadUrl,
        updatedAt: new Date().toISOString()
      };

      await update(studentRef, updatedData);
      setUserData(updatedData);
      setResumeUrl(resumeDownloadUrl);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="My Profile" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{formData.name || 'Student Name'}</h2>
                  <p className="text-blue-100">{formData.branch || 'Branch not set'}</p>
                  <p className="text-blue-100 text-sm">Roll No: {formData.rollNo || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm font-semibold whitespace-nowrap self-start sm:self-auto shadow-sm"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-sm disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="inline w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Book className="inline w-4 h-4 mr-2" />
                      Branch
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE (Ai)">CSE (Ai)</option>
                      <option value="CSE(IOT)">CSE(IOT)</option>
                      <option value="Electrical engineering (EE)">Electrical engineering (EE)</option>
                      <option value="Electronics and communication (vlsi)">Electronics and communication (vlsi)</option>
                      <option value="mechanical">mechanical</option>
                      <option value="aeraunatical">aeraunatical</option>
                      <option value="civil">civil</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Hash className="inline w-4 h-4 mr-2" />
                      Roll Number
                    </label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Star className="inline w-4 h-4 mr-2" />
                      CGPA
                    </label>
                    <input
                      type="number"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="10"
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <GraduationCap className="inline w-4 h-4 mr-2" />
                      Passing Year
                    </label>
                    <select
                      name="passingYear"
                      value={formData.passingYear}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNo"
                      value={formData.registrationNo}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g. GECG/REG/1234"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class 10th Percentage *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="class10"
                      value={formData.class10}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g. 85.50"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class 12th / Diploma (%/cgpa) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="class12"
                      value={formData.class12}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g. 91.20"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Code className="inline w-4 h-4 mr-2" />
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="React, Node.js, Python, SQL"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Upload className="inline w-4 h-4 mr-2" />
                      Resume (PDF only)
                    </label>
                    {resumeUrl && !editing && (
                      <div className="mb-2">
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Current Resume
                        </a>
                      </div>
                    )}
                    {editing && (
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    )}
                  </div>
                </div>
              </form>

              {/* Profile Statistics */}
              <div className="mt-8 pt-6 border-t dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Profile Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profile Completeness</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Object.values(formData).filter(v => v && v !== '').length * 10}%
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Skills Count</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formData.skills.split(',').filter(s => s.trim()).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">CGPA Status</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {parseFloat(formData.cgpa) >= 7 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;