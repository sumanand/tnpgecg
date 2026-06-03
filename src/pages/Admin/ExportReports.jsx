import React, { useState } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Download, FileText, Users, Briefcase, Calendar, TrendingUp, FileSpreadsheet, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportReports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const exportData = async (type, format = 'xlsx') => {
    setLoading(true);
    try {
      let data = [];
      let filename = '';

      switch(type) {
        case 'students':
          const studentsRef = ref(db, 'students');
          const studentsSnap = await get(studentsRef);
          studentsSnap.forEach((child) => {
            const val = child.val();
            data.push({
              StudentID: child.key,
              Name: val.name || '',
              RollNo: val.rollNo || '',
              CollegeRollNo: val.collegeRollNo || '',
              Email: val.email || '',
              Branch: val.branch || '',
              CGPA: val.cgpa || '',
              Phone: val.phone || '',
              PassingYear: val.passingYear || '',
              RegistrationNo: val.registrationNo || '',
              Class10th: val.class10 || '',
              Class12th: val.class12 || '',
              Skills: Array.isArray(val.skills) ? val.skills.join(', ') : (val.skills || '')
            });
          });
          filename = `students_report_${new Date().toISOString().slice(0, 10)}.${format}`;
          break;
          
        case 'placements':
          const placementsRef = ref(db, 'placement_drives');
          const placementsSnap = await get(placementsRef);
          placementsSnap.forEach((child) => {
            const val = child.val();
            data.push({
              DriveID: child.key,
              Company: val.company || '',
              Title: val.title || '',
              Role: val.role || '',
              Package: val.package || '',
              Type: val.type || 'placement',
              Location: val.location || '',
              Eligibility: val.eligibility || '',
              MinCGPA: val.minCGPA || '',
              LastDate: val.lastDate || '',
              Status: val.status || 'active'
            });
          });
          filename = `placements_report_${new Date().toISOString().slice(0, 10)}.${format}`;
          break;
          
        case 'applications':
          const appsRef = ref(db, 'applications');
          const appsSnap = await get(appsRef);
          const appsList = [];
          
          appsSnap.forEach((child) => {
            appsList.push({ id: child.key, ...child.val() });
          });
          
          for (const app of appsList) {
            const studentRef = ref(db, `students/${app.studentId}`);
            const studentSnap = await get(studentRef);
            let studentName = '';
            let studentRollNo = '';
            let studentEmail = '';
            if (studentSnap.exists()) {
              studentName = studentSnap.val().name || '';
              studentRollNo = studentSnap.val().rollNo || '';
              studentEmail = studentSnap.val().email || '';
            }
            
            data.push({
              ApplicationID: app.id,
              StudentName: studentName,
              StudentRollNo: studentRollNo,
              StudentEmail: studentEmail,
              Company: app.driveDetails?.company || '',
              Position: app.driveDetails?.title || '',
              AppliedDate: new Date(app.appliedAt).toLocaleDateString(),
              Status: app.status || 'pending',
              Feedback: app.feedback || ''
            });
          }
          filename = `applications_report_${new Date().toISOString().slice(0, 10)}.${format}`;
          break;
          
        case 'analytics':
          const stSnap = await get(ref(db, 'students'));
          const studentsCount = stSnap.numChildren() || 0;
          
          const plSnap = await get(ref(db, 'placement_drives'));
          const placementsCount = plSnap.numChildren() || 0;
          
          const applicationsSnap = await get(ref(db, 'applications'));
          const applicationsCount = applicationsSnap.numChildren() || 0;
          
          let selectedCount = 0;
          applicationsSnap.forEach((child) => {
            if (child.val().status === 'selected') {
              selectedCount++;
            }
          });
          
          data = [{
            TotalStudents: studentsCount,
            TotalPlacements: placementsCount,
            TotalApplications: applicationsCount,
            SelectedStudents: selectedCount,
            PlacementPercentage: studentsCount > 0 ? ((selectedCount / studentsCount) * 100).toFixed(2) + '%' : '0.00%',
            GeneratedAt: new Date().toISOString()
          }];
          filename = `analytics_report_${new Date().toISOString().slice(0, 10)}.${format}`;
          break;
      }

      if (data.length === 0) {
        toast.error('No records found to export');
        return;
      }

      if (format === 'json') {
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const headers = Object.keys(data[0]);
        const csvData = data.map(row => headers.map(header => JSON.stringify(row[header] !== undefined ? row[header] : '')).join(','));
        const csvContent = [headers.join(','), ...csvData].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report Sheet");
        XLSX.writeFile(workbook, filename);
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      toast.error('Error exporting report');
    } finally {
      setLoading(false);
    }
  };

  const reportOptions = [
    {
      id: 'students',
      title: 'Student Database',
      description: 'Export complete student information including profiles, CGPA, and contact details',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'placements',
      title: 'Placement Drives',
      description: 'Export all placement and internship drive details',
      icon: Briefcase,
      color: 'bg-green-500'
    },
    {
      id: 'applications',
      title: 'Applications Data',
      description: 'Export student applications with status and details',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      id: 'analytics',
      title: 'Analytics Summary',
      description: 'Export placement statistics and key metrics',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Export Reports" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Export Data & Reports</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Download reports in multiple standard formats for analysis</p>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {reportOptions.map((option) => (
                <div key={option.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className={`${option.color} p-3 rounded-lg`}>
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{option.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{option.description}</p>
                      
                      {/* Premium Format Export Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => exportData(option.id, 'xlsx')}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-1 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 gap-1 shadow-sm"
                          title="Export to Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => exportData(option.id, 'csv')}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-1 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 gap-1 shadow-sm"
                          title="Export to CSV (.csv)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => exportData(option.id, 'json')}
                          disabled={loading}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-1 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 gap-1 shadow-sm"
                          title="Export to JSON (.json)"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Format Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Available Export Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-800 dark:text-white">Excel Format (.xlsx)</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard formatted Excel workbook. Ideal for clean visual tables, filters, and charts.</p>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-800 dark:text-white">CSV Format</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compatible with Excel, Google Sheets, and most data analysis tools.</p>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileJson className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-gray-800 dark:text-white">JSON Format</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Structured data format, ideal for developers and API integrations.</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">💡 Tips for using reports</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Student reports include all profile information including CGPA and skills</li>
                <li>• Application reports show real-time status of each application</li>
                <li>• Analytics reports provide key placement metrics and trends</li>
                <li>• Export data regularly for backup and record keeping</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExportReports;