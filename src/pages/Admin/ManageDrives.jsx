import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, remove, update, push, set } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Briefcase, GraduationCap, Calendar, 
  Users, DollarSign, MapPin, Clock, AlertCircle, X, CheckCircle,
  Eye, TrendingUp, Filter, Search, FileText
} from 'lucide-react';

const ManageDrives = () => {
  const [drives, setDrives] = useState([]);
  const [internships, setInternships] = useState([]);
  const [activeTab, setActiveTab] = useState('placement');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    package: '',
    vacancies: '',
    deadline: '',
    description: '',
    requirements: '',
    eligibility: { 
      minCGPA: '', 
      branches: [],
      passingYears: []
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

  useEffect(() => {
    fetchDrives();
    fetchInternships();
  }, []);

  const fetchDrives = async () => {
    try {
      const drivesRef = ref(db, 'placement_drives');
      const snapshot = await get(drivesRef);
      const drivesList = [];
      snapshot.forEach((child) => {
        drivesList.push({ id: child.key, ...child.val() });
      });
      drivesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDrives(drivesList);
    } catch (error) {
      toast.error('Error fetching placement drives');
    }
  };

  const fetchInternships = async () => {
    try {
      const internshipsRef = ref(db, 'internship_drives');
      const snapshot = await get(internshipsRef);
      const internshipsList = [];
      snapshot.forEach((child) => {
        internshipsList.push({ id: child.key, ...child.val() });
      });
      internshipsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInternships(internshipsList);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching internships');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.company || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const driveData = {
        ...formData,
        eligibility: {
          minCGPA: parseFloat(formData.eligibility.minCGPA) || 0,
          branches: formData.eligibility.branches || [],
          passingYears: formData.eligibility.passingYears || []
        },
        vacancies: parseInt(formData.vacancies) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        applicationsCount: editingDrive ? (editingDrive.applicationsCount || 0) : 0,
        applicationFields: formData.applicationFields,
        requiredDocs: formData.requiredDocs
      };

      if (editingDrive) {
        const driveRef = ref(db, `${activeTab === 'placement' ? 'placement_drives' : 'internship_drives'}/${editingDrive.id}`);
        await update(driveRef, driveData);
        toast.success('Drive updated successfully');
      } else {
        const driveRef = push(ref(db, activeTab === 'placement' ? 'placement_drives' : 'internship_drives'));
        await set(driveRef, driveData);
        toast.success('Drive created successfully');
        
        // Send notification to all students
        const notificationRef = push(ref(db, 'notifications'));
        await set(notificationRef, {
          type: 'broadcast',
          title: `New ${activeTab === 'placement' ? 'Placement' : 'Internship'} Opportunity`,
          message: `${formData.company} is hiring for ${formData.title}. Apply before ${new Date(formData.deadline).toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
          read: false
        });
      }
      
      setShowModal(false);
      setEditingDrive(null);
      resetForm();
      
      if (activeTab === 'placement') {
        fetchDrives();
      } else {
        fetchInternships();
      }
    } catch (error) {
      toast.error('Error saving drive: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      package: '',
      vacancies: '',
      deadline: '',
      description: '',
      requirements: '',
      eligibility: { 
        minCGPA: '', 
        branches: [],
        passingYears: []
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this drive? This action cannot be undone.')) {
      try {
        await remove(ref(db, `${activeTab === 'placement' ? 'placement_drives' : 'internship_drives'}/${id}`));
        toast.success('Drive deleted successfully');
        if (activeTab === 'placement') {
          fetchDrives();
        } else {
          fetchInternships();
        }
      } catch (error) {
        toast.error('Error deleting drive');
      }
    }
  };

  const handleEdit = (drive) => {
    setEditingDrive(drive);
    setFormData({
      title: drive.title || '',
      company: drive.company || '',
      location: drive.location || '',
      package: drive.package || '',
      vacancies: drive.vacancies || '',
      deadline: drive.deadline || '',
      description: drive.description || '',
      requirements: drive.requirements || '',
      eligibility: {
        minCGPA: drive.eligibility?.minCGPA || '',
        branches: drive.eligibility?.branches || [],
        passingYears: drive.eligibility?.passingYears || []
      },
      applicationFields: drive.applicationFields || {
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
      requiredDocs: drive.requiredDocs || {
        resume: false,
        transcript: false,
        photo: false,
        collegeId: false
      }
    });
    setShowModal(true);
  };

  const handleViewDetails = (drive) => {
    setSelectedDrive(drive);
    setShowDetailsModal(true);
  };

  const toggleDriveStatus = async (drive) => {
    const newStatus = drive.status === 'active' ? 'closed' : 'active';
    try {
      await update(ref(db, `${activeTab === 'placement' ? 'placement_drives' : 'internship_drives'}/${drive.id}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Drive ${newStatus === 'active' ? 'activated' : 'closed'} successfully`);
      if (activeTab === 'placement') {
        fetchDrives();
      } else {
        fetchInternships();
      }
    } catch (error) {
      toast.error('Error updating drive status');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    } else if (status === 'closed') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Closed</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Draft</span>;
    }
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const currentItems = activeTab === 'placement' ? drives : internships;
  
  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: currentItems.length,
    active: currentItems.filter(i => i.status === 'active').length,
    closed: currentItems.filter(i => i.status === 'closed').length,
    expired: currentItems.filter(i => isDeadlinePassed(i.deadline) && i.status === 'active').length
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
        <Header title="Manage Drives" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab('placement');
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'placement'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Placement Drives
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">{drives.length}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('internship');
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'internship'
                    ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Internship Drives
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">{internships.length}</span>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Drives</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Active Drives</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Closed Drives</p>
                    <p className="text-2xl font-bold text-red-600">{stats.closed}</p>
                  </div>
                  <X className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Expired</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.expired}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
              <div className="flex-1 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by title or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setEditingDrive(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Drive
              </button>
            </div>

            {/* Drives Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title & Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Package/Stipend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vacancies</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.map((drive) => (
                      <tr key={drive.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{drive.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{drive.company}</div>
                          <div className="text-xs text-gray-400 mt-1">{drive.location || 'Location not specified'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {activeTab === 'placement' ? drive.package : drive.stipend || 'Unpaid'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {drive.vacancies || 'Not specified'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(drive.deadline).toLocaleDateString()}
                          </div>
                          {isDeadlinePassed(drive.deadline) && drive.status === 'active' && (
                            <span className="text-xs text-red-600">Expired</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(drive.status)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(drive)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(drive)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleDriveStatus(drive)}
                              className={`p-1 ${drive.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              title={drive.status === 'active' ? 'Close Drive' : 'Activate Drive'}
                            >
                              {drive.status === 'active' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(drive.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No drives found</p>
                  <button
                    onClick={() => {
                      setEditingDrive(null);
                      resetForm();
                      setShowModal(true);
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Create your first drive
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Drive Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingDrive ? 'Edit Drive' : `Create New ${activeTab === 'placement' ? 'Placement' : 'Internship'} Drive`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drive Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Software Engineer, Data Analyst"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State or Remote"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {activeTab === 'placement' ? 'Package (CTC)' : 'Stipend'}
                  </label>
                  <input
                    type="text"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    placeholder={activeTab === 'placement' ? "e.g., 12 LPA" : "e.g., 25000/month"}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Number of Vacancies
                  </label>
                  <input
                    type="number"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Eligibility Criteria Section */}
              <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Eligibility Criteria
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum CGPA *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.eligibility.minCGPA}
                      onChange={(e) => setFormData({
                        ...formData,
                        eligibility: { ...formData.eligibility, minCGPA: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Eligible Branches (Hold Ctrl to select multiple)
                    </label>
                    <select
                      multiple
                      value={formData.eligibility.branches}
                      onChange={(e) => {
                        const options = e.target.options;
                        const selected = [];
                        for (let i = 0; i < options.length; i++) {
                          if (options[i].selected) selected.push(options[i].value);
                        }
                        setFormData({
                          ...formData,
                          eligibility: { ...formData.eligibility, branches: selected }
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                <h4 className="text-md font-semibold text-gray-800 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500 animate-pulse" />
                  Application Form Builder
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select what student details and documents you want to collect during the application process.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Details to Collect */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-gray-750 dark:text-gray-300 text-xs border-b pb-2">
                      1. Personal & Academic Details
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5">
                        <input type="checkbox" checked disabled className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed" />
                        <div>
                          <label className="font-semibold text-gray-800 dark:text-white block text-sm">Full Name</label>
                          <span className="text-xs text-gray-500 block">Always Collected</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5">
                        <input type="checkbox" checked disabled className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed" />
                        <div>
                          <label className="font-semibold text-gray-800 dark:text-white block text-sm">Email Address</label>
                          <span className="text-xs text-gray-500 block">Always Collected</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_phone"
                          checked={formData.applicationFields.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, phone: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_phone" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Phone Number</label>
                          <span className="text-xs text-gray-500 block">Contact Mobile</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_reg"
                          checked={formData.applicationFields.registrationNo}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, registrationNo: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_reg" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Registration No</label>
                          <span className="text-xs text-gray-500 block">College Reg No</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_roll"
                          checked={formData.applicationFields.rollNo}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, rollNo: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_roll" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">College Roll No</label>
                          <span className="text-xs text-gray-500 block">Roll Number</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_branch"
                          checked={formData.applicationFields.branch}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, branch: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_branch" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Branch</label>
                          <span className="text-xs text-gray-500 block">Academic Stream</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_class10"
                          checked={formData.applicationFields.class10}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, class10: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_class10" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Class 10th %</label>
                          <span className="text-xs text-gray-500 block">Matriculation %</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_class12"
                          checked={formData.applicationFields.class12}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, class12: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_class12" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Class 12th/Diploma %</label>
                          <span className="text-xs text-gray-500 block">Intermediate %</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_field_cgpa"
                          checked={formData.applicationFields.cgpa}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationFields: { ...formData.applicationFields, cgpa: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_field_cgpa" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Btech CGPA</label>
                          <span className="text-xs text-gray-500 block">Current BTech CGPA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents to Collect */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-gray-750 dark:text-gray-300 text-xs border-b pb-2">
                      2. Required Documents (Optional Uploads)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_doc_resume"
                          checked={formData.requiredDocs.resume}
                          onChange={(e) => setFormData({
                            ...formData,
                            requiredDocs: { ...formData.requiredDocs, resume: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_doc_resume" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Resume / CV</label>
                          <span className="text-xs text-gray-500 block">Optional PDF</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_doc_transcript"
                          checked={formData.requiredDocs.transcript}
                          onChange={(e) => setFormData({
                            ...formData,
                            requiredDocs: { ...formData.requiredDocs, transcript: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_doc_transcript" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Semester Marksheet</label>
                          <span className="text-xs text-gray-500 block">Optional PDF Marks</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_doc_photo"
                          checked={formData.requiredDocs.photo}
                          onChange={(e) => setFormData({
                            ...formData,
                            requiredDocs: { ...formData.requiredDocs, photo: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_doc_photo" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">Passport Size Photo</label>
                          <span className="text-xs text-gray-500 block">Optional image/PDF</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-150 dark:border-gray-700 flex items-start space-x-2.5 hover:shadow-sm transition-shadow">
                        <input
                          type="checkbox"
                          id="admin_doc_collegeId"
                          checked={formData.requiredDocs.collegeId}
                          onChange={(e) => setFormData({
                            ...formData,
                            requiredDocs: { ...formData.requiredDocs, collegeId: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="admin_doc_collegeId" className="font-semibold text-gray-800 dark:text-white block text-sm cursor-pointer">College ID Card</label>
                          <span className="text-xs text-gray-500 block">Optional Card PDF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job/Internship Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe the role, responsibilities, and what the candidate will do..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements & Skills *
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  placeholder="List the technical and soft skills required..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  {editingDrive ? 'Update Drive' : 'Create Drive'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedDrive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Drive Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className={`p-4 rounded-lg ${activeTab === 'placement' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedDrive.title}</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{selectedDrive.company}</p>
                  </div>
                  {getStatusBadge(selectedDrive.status)}
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{selectedDrive.location || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {activeTab === 'placement' ? (
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">{activeTab === 'placement' ? 'Package' : 'Duration'}</p>
                    <p className="text-sm font-medium">
                      {activeTab === 'placement' ? selectedDrive.package : `${selectedDrive.duration} months`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Vacancies</p>
                    <p className="text-sm font-medium">{selectedDrive.vacancies || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-sm font-medium">{new Date(selectedDrive.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Eligibility Criteria</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Minimum CGPA</p>
                      <p className="font-medium">{selectedDrive.eligibility?.minCGPA || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Eligible Branches</p>
                      <p className="font-medium">
                        {selectedDrive.eligibility?.branches?.length > 0 
                          ? selectedDrive.eligibility.branches.join(', ') 
                          : 'All branches'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Required Documents (Uploads)</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex flex-wrap gap-2.5">
                  {selectedDrive.requiredDocs?.resume ? (
                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-lg">
                      Resume / CV
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium rounded-lg line-through">
                      Resume / CV
                    </span>
                  )}
                  {selectedDrive.requiredDocs?.transcript ? (
                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-lg">
                      Semester Marksheet
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium rounded-lg line-through">
                      Semester Marksheet
                    </span>
                  )}
                  {selectedDrive.requiredDocs?.photo ? (
                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-lg">
                      Passport Size Photo
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium rounded-lg line-through">
                      Passport Size Photo
                    </span>
                  )}
                  {selectedDrive.requiredDocs?.collegeId ? (
                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-lg">
                      College ID Card
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium rounded-lg line-through">
                      College ID Card
                    </span>
                  )}
                  {!selectedDrive.requiredDocs && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium italic">
                      No documents required
                    </span>
                  )}
                </div>
              </div>

              {/* Fields to Collect */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Application Details Collected</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex flex-wrap gap-2.5">
                  <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                    Full Name
                  </span>
                  <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                    Email Address
                  </span>
                  {selectedDrive.applicationFields?.phone && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      Phone Number
                    </span>
                  )}
                  {selectedDrive.applicationFields?.registrationNo && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      Registration No
                    </span>
                  )}
                  {selectedDrive.applicationFields?.rollNo && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      College Roll No
                    </span>
                  )}
                  {selectedDrive.applicationFields?.branch && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      Branch
                    </span>
                  )}
                  {selectedDrive.applicationFields?.class10 && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      Class 10th %
                    </span>
                  )}
                  {selectedDrive.applicationFields?.class12 && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      Class 12th/Diploma %
                    </span>
                  )}
                  {selectedDrive.applicationFields?.cgpa && (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-semibold rounded-lg">
                      BTech CGPA
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedDrive.description && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedDrive.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedDrive.requirements && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Requirements & Skills</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedDrive.requirements}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-400 border-t dark:border-gray-700 pt-4">
                <p>Created: {new Date(selectedDrive.createdAt).toLocaleString()}</p>
                {selectedDrive.updatedAt && <p>Last updated: {new Date(selectedDrive.updatedAt).toLocaleString()}</p>}
                <p>Applications received: {selectedDrive.applicationsCount || 0}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedDrive);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Edit Drive
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400"
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

export default ManageDrives;