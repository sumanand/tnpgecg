import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, push, set } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { GraduationCap, MapPin, Calendar, Users, Clock, Send, Award, DollarSign, FileText } from 'lucide-react';

const PostInternship = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: userData?.name || '',
    location: '',
    stipend: '',
    duration: '',
    vacancies: '',
    description: '',
    requirements: '',
    deadline: '',
    eligibility: {
      minCGPA: '',
      branches: [],
      year: ''
    },
    applicationFields: {
      name: true,
      email: true,
      phone: true,
      registrationNo: true,
      rollNo: true,
      branch: true,
      class10: true,
      class12: true,
      cgpa: true
    },
    requiredDocs: {
      resume: false,
      transcript: false,
      photo: false,
      collegeId: false
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('eligibility.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        eligibility: { ...formData.eligibility, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBranchChange = (e) => {
    const options = e.target.options;
    const selectedBranches = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedBranches.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      eligibility: { ...formData.eligibility, branches: selectedBranches }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const internshipRef = push(ref(db, 'internship_drives'));
      await set(internshipRef, {
        ...formData,
        companyId: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'active',
        eligibility: {
          minCGPA: parseFloat(formData.eligibility.minCGPA),
          branches: formData.eligibility.branches,
          year: formData.eligibility.year
        },
        applicationFields: formData.applicationFields,
        requiredDocs: formData.requiredDocs
      });

      // Send notification to students
      const notificationRef = push(ref(db, 'notifications'));
      await set(notificationRef, {
        type: 'broadcast',
        title: 'New Internship Opportunity',
        message: `${formData.company} is offering internship for ${formData.title}. Apply now!`,
        createdAt: new Date().toISOString(),
        read: false
      });

      toast.success('Internship posted successfully!');
      setFormData({
        title: '',
        company: userData?.name || '',
        location: '',
        stipend: '',
        duration: '',
        vacancies: '',
        description: '',
        requirements: '',
        deadline: '',
        eligibility: { minCGPA: '', branches: [], year: '' },
        applicationFields: {
          name: true,
          email: true,
          phone: true,
          registrationNo: true,
          rollNo: true,
          branch: true,
          class10: true,
          class12: true,
          cgpa: true
        },
        requiredDocs: {
          resume: false,
          transcript: false,
          photo: false,
          collegeId: false
        }
      });
    } catch (error) {
      toast.error('Error posting internship: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="company" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Post Internship" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <GraduationCap className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Post a New Internship</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Internship Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Development Intern"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Remote / Office location"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Stipend *
                    </label>
                    <input
                      type="text"
                      name="stipend"
                      value={formData.stipend}
                      onChange={handleInputChange}
                      placeholder="e.g., 25000/month or Unpaid"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Duration (months) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 3"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="inline w-4 h-4 mr-1" />
                      Number of Vacancies *
                    </label>
                    <input
                      type="number"
                      name="vacancies"
                      value={formData.vacancies}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>

                {/* Eligibility Criteria */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Eligibility Criteria
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum CGPA *
                      </label>
                      <input
                        type="number"
                        name="eligibility.minCGPA"
                        value={formData.eligibility.minCGPA}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        max="10"
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Eligible Year *
                      </label>
                      <select
                        name="eligibility.year"
                        value={formData.eligibility.year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                      >
                        <option value="">Select Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Pre-final">Pre-final Year</option>
                        <option value="Final">Final Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Eligible Branches (Ctrl+Click)
                      </label>
                      <select
                        multiple
                        value={formData.eligibility.branches}
                        onChange={handleBranchChange}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        size={4}
                      >
                        <option value="CSE (Ai)">CSE (Ai)</option>
                        <option value="CSE(IOT)">CSE(IOT)</option>
                        <option value="Electrical engineering (EE)">Electrical engineering (EE)</option>
                        <option value="Electronics and communication (vlsi)">Electronics and communication (vlsi)</option>
                        <option value="mechanical">mechanical</option>
                        <option value="aeraunatical">aeraunatical</option>
                        <option value="civil">civil</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Leave empty for all branches</p>
                    </div>
                  </div>
                </div>

                {/* Application Fields & Documents Form Builder */}
                <div className="border-t pt-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600 animate-pulse" />
                    Application Form Builder
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose what student details and documents you want to collect during the application process.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Details to Collect */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm border-b pb-2">
                        1. Personal & Academic Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3">
                          <input type="checkbox" checked disabled className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-not-allowed" />
                          <div>
                            <label className="font-semibold text-gray-800 dark:text-white block text-sm">Full Name</label>
                            <span className="text-xs text-gray-500 block">Always Collected</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3">
                          <input type="checkbox" checked disabled className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-not-allowed" />
                          <div>
                            <label className="font-semibold text-gray-800 dark:text-white block text-sm">Email Address</label>
                            <span className="text-xs text-gray-500 block">Always Collected</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_phone"
                            checked={formData.applicationFields.phone}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, phone: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_phone" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Phone Number</label>
                            <span className="text-xs text-gray-500 block">Contact Mobile</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_reg"
                            checked={formData.applicationFields.registrationNo}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, registrationNo: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_reg" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Registration No</label>
                            <span className="text-xs text-gray-500 block">College Reg No</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_roll"
                            checked={formData.applicationFields.rollNo}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, rollNo: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_roll" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">College Roll No</label>
                            <span className="text-xs text-gray-500 block">Roll Number</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_branch"
                            checked={formData.applicationFields.branch}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, branch: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_branch" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Branch</label>
                            <span className="text-xs text-gray-500 block">Academic Stream</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_class10"
                            checked={formData.applicationFields.class10}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, class10: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_class10" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Class 10th %</label>
                            <span className="text-xs text-gray-500 block">Matriculation %</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_class12"
                            checked={formData.applicationFields.class12}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, class12: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_class12" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Class 12th/Diploma %</label>
                            <span className="text-xs text-gray-500 block">Intermediate %</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="field_cgpa"
                            checked={formData.applicationFields.cgpa}
                            onChange={(e) => setFormData({
                              ...formData,
                              applicationFields: { ...formData.applicationFields, cgpa: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="field_cgpa" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Btech CGPA</label>
                            <span className="text-xs text-gray-500 block">Current BTech CGPA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents to Collect */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm border-b pb-2">
                        2. Required Documents (Optional Uploads)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="doc_resume"
                            checked={formData.requiredDocs.resume}
                            onChange={(e) => setFormData({
                              ...formData,
                              requiredDocs: { ...formData.requiredDocs, resume: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="doc_resume" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Resume / CV</label>
                            <span className="text-xs text-gray-500 block">Optional PDF</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="doc_transcript"
                            checked={formData.requiredDocs.transcript}
                            onChange={(e) => setFormData({
                              ...formData,
                              requiredDocs: { ...formData.requiredDocs, transcript: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="doc_transcript" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Semester Marksheet</label>
                            <span className="text-xs text-gray-500 block">Optional PDF Marks</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="doc_photo"
                            checked={formData.requiredDocs.photo}
                            onChange={(e) => setFormData({
                              ...formData,
                              requiredDocs: { ...formData.requiredDocs, photo: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="doc_photo" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Passport Size Photo</label>
                            <span className="text-xs text-gray-500 block">Optional image/PDF</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            id="doc_collegeId"
                            checked={formData.requiredDocs.collegeId}
                            onChange={(e) => setFormData({
                              ...formData,
                              requiredDocs: { ...formData.requiredDocs, collegeId: e.target.checked }
                            })}
                            className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="doc_collegeId" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">College ID Card</label>
                            <span className="text-xs text-gray-500 block">Optional Card PDF</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internship Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements/Skills Required *
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="List the technical and soft skills required..."
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {loading ? 'Posting...' : 'Post Internship'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PostInternship;