import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, update, set, push, child } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Search, Building, Check, X, Mail, Phone, Globe, MapPin, Filter, Plus, PlusCircle } from 'lucide-react';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  
  // Manual Recruiter Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [recruiterForm, setRecruiterForm] = useState({
    name: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    logoUrl: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesRef = ref(db, 'companies');
      const snapshot = await get(companiesRef);
      const companiesList = [];
      snapshot.forEach((child) => {
        const val = child.val();
        if (!val.isTnpTeam) {
          companiesList.push({ id: child.key, ...val });
        }
      });
      setCompanies(companiesList);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching companies');
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = companies;

    // Filter by tab status
    if (activeTab === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending' || !c.status);
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(c => c.status === 'approved');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(c => c.status === 'rejected');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by industry
    if (industryFilter !== 'all') {
      filtered = filtered.filter(c => c.industry === industryFilter);
    }

    setFilteredCompanies(filtered);
  }, [searchTerm, industryFilter, activeTab, companies]);

  const handleStatusUpdate = async (companyId, newStatus) => {
    try {
      // 1. Update company status in database
      await update(ref(db, `companies/${companyId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // 2. Also update status in corresponding user role mapping if needed
      try {
        await update(ref(db, `users/${companyId}`), {
          status: newStatus
        });
      } catch (err) {
        console.warn('Could not update status in users mapping node:', err.message);
      }

      toast.success(`Company status updated to ${newStatus}`);
      fetchCompanies();
    } catch (error) {
      toast.error(`Error updating company status: ${error.message}`);
    }
  };

  const industries = ['all', ...new Set(companies.map(c => c.industry).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Manage Companies" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header action */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recruiter & Company Approvals</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage registered corporate profiles and verify recruiters.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Pending Approvals ({companies.filter(c => c.status === 'pending' || !c.status).length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeTab === 'approved'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Approved ({companies.filter(c => c.status === 'approved').length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeTab === 'rejected'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Rejected ({companies.filter(c => c.status === 'rejected').length})
              </button>
            </div>

            {/* Filters bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by company name, email, or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="text-gray-400 w-5 h-5" />
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {industries.map(ind => (
                      <option key={ind} value={ind}>
                        {ind === 'all' ? 'All Industries' : ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-800/50 p-5 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                    <div className="p-3 bg-blue-500 text-white rounded-xl">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-lg">{company.name}</h4>
                      <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-medium mt-1">
                        {company.industry || 'General Industry'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 mr-2.5 text-gray-400" />
                      <a href={`mailto:${company.email}`} className="hover:underline text-blue-600 dark:text-blue-400 break-all">
                        {company.email}
                      </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4 mr-2.5 text-gray-400" />
                      <span>{company.phone || 'No phone provided'}</span>
                    </div>
                    {company.website && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Globe className="w-4 h-4 mr-2.5 text-gray-400" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 dark:text-blue-400 truncate">
                          {company.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{company.address || 'No address provided'}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
                    {company.status === 'approved' ? (
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'rejected')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium rounded-lg text-xs transition-colors flex items-center"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Revoke Approval
                      </button>
                    ) : company.status === 'rejected' ? (
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'approved')}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400 font-medium rounded-lg text-xs transition-colors flex items-center"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Re-Approve
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(company.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs transition-colors flex items-center shadow-sm"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(company.id, 'approved')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-xs transition-colors flex items-center shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md mt-6">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">No Companies Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  There are no corporate records matching this filter.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageCompanies;
