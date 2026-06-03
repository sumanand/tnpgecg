import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, remove, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Search, Edit2, Trash2, UserPlus, Filter, Download, Mail, Phone, MapPin, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    branch: '',
    cgpa: '',
    phone: '',
    passingYear: '',
    registrationNo: '',
    class10: '',
    class12: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsRef = ref(db, 'students');
      const snapshot = await get(studentsRef);
      const studentsList = [];
      snapshot.forEach((child) => {
        studentsList.push({ id: child.key, ...child.val() });
      });
      setStudents(studentsList);
      setFilteredStudents(studentsList);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching students');
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = students;
    
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(student => student.branch === selectedBranch);
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, selectedBranch, students]);

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await remove(ref(db, `students/${studentId}`));
        await remove(ref(db, `users/${studentId}`));
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Error deleting student');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      rollNo: student.rollNo || '',
      branch: student.branch || '',
      cgpa: student.cgpa || '',
      phone: student.phone || '',
      passingYear: student.passingYear || '',
      registrationNo: student.registrationNo || '',
      class10: student.class10 || '',
      class12: student.class12 || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await update(ref(db, `students/${editingStudent.id}`), {
        name: formData.name,
        branch: formData.branch,
        rollNo: formData.rollNo,
        cgpa: parseFloat(formData.cgpa) || 0,
        phone: formData.phone,
        passingYear: formData.passingYear,
        registrationNo: formData.registrationNo,
        class10: formData.class10 ? parseFloat(formData.class10) : '',
        class12: formData.class12 ? parseFloat(formData.class12) : '',
        updatedAt: new Date().toISOString()
      });
      toast.success('Student updated successfully');
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Error updating student');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Roll No', 'Branch', 'CGPA', 'Email', 'Phone', 'Passing Year'];
    const csvData = filteredStudents.map(student => [
      student.name,
      student.rollNo,
      student.branch,
      student.cgpa,
      student.email,
      student.phone,
      student.passingYear
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_data.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const exportToExcel = () => {
    const data = filteredStudents.map(student => ({
      Name: student.name || 'N/A',
      'Roll No': student.rollNo || 'N/A',
      Branch: student.branch || 'N/A',
      CGPA: student.cgpa || 0,
      Email: student.email || 'N/A',
      Phone: student.phone || 'N/A',
      'Passing Year': student.passingYear || 'N/A',
      'Registration No': student.registrationNo || 'N/A',
      'Class 10%': student.class10 || 'N/A',
      'Class 12% / Diploma': student.class12 || 'N/A',
      Skills: Array.isArray(student.skills) ? student.skills.join(', ') : (student.skills || 'N/A')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "students_data.xlsx");
    toast.success('Excel report exported successfully');
  };

  const branches = ['all', ...new Set(students.map(s => s.branch).filter(Boolean))];

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
        <Header title="Manage Students" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Student Management</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Total Students: {students.length}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 shrink-0" />
                  Export Excel
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap"
                >
                  <Download className="w-4 h-4 mr-2 shrink-0" />
                  Export CSV
                </button>
                 <button
                  onClick={() => navigate('/admin/upload-students')}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 mr-2 shrink-0" />
                  Add Student
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, roll no, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="text-gray-400 w-5 h-5" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {branches.map(branch => (
                      <option key={branch} value={branch}>
                        {branch === 'all' ? 'All Branches' : branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.rollNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.branch}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.cgpa >= 8 ? 'bg-green-100 text-green-800' :
                            student.cgpa >= 7 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.cgpa}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.passingYear}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No students found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Edit Student</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <input
                type="text"
                placeholder="Roll No"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
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
              <input
                type="number"
                step="0.01"
                placeholder="CGPA"
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Registration Number"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Class 10th Percentage"
                value={formData.class10}
                onChange={(e) => setFormData({ ...formData, class10: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Class 12th / Diploma Percentage"
                value={formData.class12}
                onChange={(e) => setFormData({ ...formData, class12: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={formData.passingYear}
                onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="">Select Passing Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;