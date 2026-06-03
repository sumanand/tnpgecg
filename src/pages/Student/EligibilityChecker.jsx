import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Award, Users, Briefcase } from 'lucide-react';

const EligibilityChecker = () => {
  const { userData } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const drivesRef = ref(db, 'placement_drives');
      const snapshot = await get(drivesRef);
      const drivesList = [];
      snapshot.forEach((child) => {
        drivesList.push({ id: child.key, ...child.val() });
      });
      setDrives(drivesList);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const checkEligibility = (drive) => {
    const cgpa = parseFloat(userData?.cgpa) || 0;
    const minCgpa = drive.eligibility?.minCGPA || 0;
    const allowedBranches = drive.eligibility?.branches || [];
    
    const cgpaCheck = cgpa >= minCgpa;
    const branchCheck = allowedBranches.length === 0 || allowedBranches.includes(userData?.branch);
    
    return {
      eligible: cgpaCheck && branchCheck,
      cgpaCheck,
      branchCheck,
      details: {
        requiredCGPA: minCgpa,
        yourCGPA: cgpa,
        requiredBranches: allowedBranches,
        yourBranch: userData?.branch
      }
    };
  };

  const getEligibilityStats = () => {
    const total = drives.length;
    const eligible = drives.filter(d => checkEligibility(d).eligible).length;
    const notEligible = total - eligible;
    const averageCGPARequired = drives.reduce((sum, d) => sum + (d.eligibility?.minCGPA || 0), 0) / total;
    
    return { total, eligible, notEligible, averageCGPARequired: averageCGPARequired.toFixed(1) };
  };

  const stats = getEligibilityStats();

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
        <Header title="Eligibility Checker" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Drives</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Eligible Drives</p>
                    <p className="text-2xl font-bold text-green-600">{stats.eligible}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Not Eligible</p>
                    <p className="text-2xl font-bold text-red-600">{stats.notEligible}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Avg CGPA Required</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.averageCGPARequired}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Your Profile Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md p-6 mb-8 text-white">
              <h3 className="text-lg font-semibold mb-3">Your Profile Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">CGPA</p>
                  <p className="text-2xl font-bold">{userData?.cgpa || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Branch</p>
                  <p className="text-2xl font-bold">{userData?.branch || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Skills</p>
                  <p className="text-lg font-semibold">{userData?.skills?.length || 0}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Passing Year</p>
                  <p className="text-2xl font-bold">{userData?.passingYear || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Eligibility Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Drive Eligibility Status</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Check your eligibility for each placement drive</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CGPA Required</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branches</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {drives.map((drive) => {
                      const eligibility = checkEligibility(drive);
                      return (
                        <tr key={drive.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {drive.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {drive.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {drive.eligibility?.minCGPA || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {drive.eligibility?.branches?.join(', ') || 'All Branches'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {eligibility.eligible ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Eligible
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Not Eligible
                                </span>
                                {!eligibility.cgpaCheck && (
                                  <p className="text-xs text-red-600 mt-1">CGPA below requirement</p>
                                )}
                                {!eligibility.branchCheck && (
                                  <p className="text-xs text-red-600 mt-1">Branch not eligible</p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {drives.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No placement drives available</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EligibilityChecker;