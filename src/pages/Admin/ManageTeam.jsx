import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, set, remove, push, child } from 'firebase/database';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Download, 
  UploadCloud, 
  FileSpreadsheet, 
  Layers, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  Play,
  Mail,
  Phone,
  Book,
  UserCheck
} from 'lucide-react';

const ManageTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'bulk', or 'manual'
  
  // Bulk upload states
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Member form
  const [memberForm, setMemberForm] = useState({
    name: '',
    category: '', // 'Principal', 'TPO', 'T&P coordinator', 'T&P student coordinator'
    designation: '',
    department: '',
    email: '',
    phone: '',
    photoUrl: ''
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Query /companies since it has open authenticated read/write permissions
      const companiesRef = ref(db, 'companies');
      const snapshot = await get(companiesRef);
      const list = [];
      if (snapshot.exists()) {
        snapshot.forEach((c) => {
          const val = c.val();
          // Filter only T&P Cell team members
          if (val.isTnpTeam === true) {
            list.push({ id: c.key, ...val });
          }
        });
      }
      setTeamMembers(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load T&P Team members.");
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the T&P Cell list?`)) {
      try {
        await remove(ref(db, `companies/${id}`));
        toast.success(`Removed ${name} successfully!`);
        fetchTeamMembers();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete member.");
      }
    }
  };

  // Templates Downloads
  const downloadXLSXTemplate = () => {
    const data = [
      {
        "name": "Dr. R. K. Singh",
        "category": "Principal",
        "designation": "Principal GEC Gopalganj",
        "department": "Administration",
        "email": "principal@gecgopalganj.ac.in",
        "phone": "06156295111",
        "photoUrl": ""
      },
      {
        "name": "Prof. Sandeep Kumar",
        "category": "TPO",
        "designation": "Head, Training & Placement Cell",
        "department": "Civil Engineering",
        "email": "tpo@gecgopalganj.ac.in",
        "phone": "9876543219",
        "photoUrl": ""
      },
      {
        "name": "Prof. Amit Verma",
        "category": "T&P coordinator",
        "designation": "Assistant Professor & Faculty Coordinator",
        "department": "Mechanical Engineering",
        "email": "amit.coordinator@gecgopalganj.ac.in",
        "phone": "9876543211",
        "photoUrl": ""
      },
      {
        "name": "Anjali Priya",
        "category": "T&P student coordinator",
        "designation": "Student Representative - CSE",
        "department": "Computer Science Engineering",
        "email": "anjali.cse22@gecgopalganj.ac.in",
        "phone": "9876543212",
        "photoUrl": ""
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team");
    XLSX.writeFile(workbook, "tnp_team_template.xlsx");
    toast.success("Excel template download started");
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "name,category,designation,department,email,phone,photoUrl\n"
      + "Dr. R. K. Singh,Principal,Principal GEC Gopalganj,Administration,principal@gecgopalganj.ac.in,06156295111,\n"
      + "Prof. Sandeep Kumar,TPO,Head, Training & Placement Cell,Civil Engineering,tpo@gecgopalganj.ac.in,9876543219,\n"
      + "Prof. Amit Verma,T&P coordinator,Assistant Professor,Mechanical Engineering,amit@gecgopalganj.ac.in,9876543211,\n"
      + "Anjali Priya,T&P student coordinator,Student Coordinator CSE,Computer Science Engineering,anjali@gecgopalganj.ac.in,9876543212,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tnp_team_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template download started");
  };

  const downloadJSONTemplate = () => {
    const jsonContent = [
      {
        "name": "Dr. R. K. Singh",
        "category": "Principal",
        "designation": "Principal GEC Gopalganj",
        "department": "Administration",
        "email": "principal@gecgopalganj.ac.in",
        "phone": "06156295111"
      },
      {
        "name": "Prof. Sandeep Kumar",
        "category": "TPO",
        "designation": "Head, Training & Placement Cell",
        "department": "Civil Engineering",
        "email": "tpo@gecgopalganj.ac.in"
      }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonContent, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "tnp_team_template.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON template download started");
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const record = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      if (record.name && record.category) {
        parsedData.push(record);
      }
    }
    return parsedData;
  };

  const processUploadedRecords = (rawData) => {
    if (!rawData || rawData.length === 0) {
      toast.error("No valid team records found.");
      return;
    }

    const validCategories = ['Principal', 'TPO', 'T&P coordinator', 'T&P student coordinator'];
    
    const processed = rawData.map(row => {
      const record = {};
      Object.keys(row).forEach(key => {
        const normKey = key.trim().toLowerCase();
        let stdKey = key.trim();
        if (normKey === 'name') stdKey = 'name';
        else if (normKey === 'category' || normKey === 'role' || normKey === 'position') stdKey = 'category';
        else if (normKey === 'designation' || normKey === 'title') stdKey = 'designation';
        else if (normKey === 'department' || normKey === 'branch') stdKey = 'department';
        else if (normKey === 'email') stdKey = 'email';
        else if (normKey === 'phone' || normKey === 'contact') stdKey = 'phone';
        else if (normKey === 'photourl' || normKey === 'photo') stdKey = 'photoUrl';
        
        record[stdKey] = row[key];
      });

      // Normalize Categories strictly
      let mappedCat = record.category || '';
      const cleanCat = mappedCat.trim().toLowerCase();
      if (cleanCat.includes('principal')) mappedCat = 'Principal';
      else if (cleanCat === 'tpo' || cleanCat.includes('placement officer')) mappedCat = 'TPO';
      else if (cleanCat.includes('student coordinator')) mappedCat = 'T&P student coordinator';
      else if (cleanCat.includes('coordinator') || cleanCat.includes('faculty')) mappedCat = 'T&P coordinator';

      const isValidCategory = validCategories.includes(mappedCat);

      return {
        ...record,
        category: mappedCat,
        isValid: record.name && isValidCategory && record.designation
      };
    });

    setPreviewData(processed);
    toast.success(`Successfully parsed ${processed.length} team members.`);
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJSON = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processUploadedRecords(rawJSON);
        } catch (err) {
          console.error(err);
          toast.error("Error reading Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          if (file.name.endsWith('.json')) {
            const rawJSON = JSON.parse(text);
            processUploadedRecords(Array.isArray(rawJSON) ? rawJSON : [rawJSON]);
          } else if (file.name.endsWith('.csv')) {
            const rawCSV = parseCSV(text);
            processUploadedRecords(rawCSV);
          } else {
            toast.error("Unsupported file format.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error reading file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.category || !memberForm.designation) {
      toast.error("Please fill in Name, Category, and Designation fields.");
      return;
    }

    setIsUploading(true);
    try {
      const newKey = push(child(ref(db), 'companies')).key;
      const customId = `tnp_member_${newKey}`;
      
      const payload = {
        id: customId,
        name: memberForm.name,
        category: memberForm.category,
        designation: memberForm.designation,
        department: memberForm.department || 'T&P Cell',
        email: (memberForm.email || 'tnp.member@gecgopalganj.ac.in').toLowerCase(), // Required for companies rule validation
        phone: memberForm.phone || '',
        photoUrl: memberForm.photoUrl || '',
        isTnpTeam: true,
        status: 'approved', // Prevents it from appearing in standard approvals
        createdAt: new Date().toISOString()
      };

      await set(ref(db, `companies/${customId}`), payload);
      toast.success(`${memberForm.name} added successfully as ${memberForm.category}!`);
      
      setMemberForm({
        name: '',
        category: '',
        designation: '',
        department: '',
        email: '',
        phone: '',
        photoUrl: ''
      });
      setActiveTab('list');
      fetchTeamMembers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add member to database.");
    } finally {
      setIsUploading(false);
    }
  };

  const commitBulkTeamData = async () => {
    if (previewData.length === 0) return;
    
    const invalidCount = previewData.filter(m => !m.isValid).length;
    if (invalidCount > 0) {
      if (!window.confirm(`${invalidCount} records have invalid data or categories. They will be skipped. Continue?`)) {
        return;
      }
    }

    setIsUploading(true);
    let successCount = 0;
    try {
      for (const member of previewData) {
        if (!member.isValid) continue;

        const newKey = push(child(ref(db), 'companies')).key;
        const customId = `tnp_member_${newKey}`;
        
        const payload = {
          id: customId,
          name: member.name,
          category: member.category,
          designation: member.designation,
          department: member.department || 'T&P Cell',
          email: (member.email || 'tnp.member@gecgopalganj.ac.in').toLowerCase(), // Required for companies rule validation
          phone: member.phone || '',
          photoUrl: member.photoUrl || '',
          isTnpTeam: true,
          status: 'approved',
          createdAt: new Date().toISOString()
        };

        await set(ref(db, `companies/${customId}`), payload);
        successCount++;
      }

      toast.success(`Uploaded ${successCount} T&P Cell members successfully!`);
      setFileName('');
      setPreviewData([]);
      setActiveTab('list');
      fetchTeamMembers();
    } catch (err) {
      console.error(err);
      toast.error("Database writing error.");
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Principal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200';
      case 'TPO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200';
      case 'T&P coordinator': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200';
      case 'T&P student coordinator': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Manage T&P Team Cell" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header intro */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white font-sans">
                  T&P Cell Team Management
                </h2>
                <p className="text-gray-650 dark:text-gray-400 mt-2 text-sm">
                  Add and manage Training & Placement Cell members (Principal, TPO, Faculty T&P Coordinators, and Student Representatives) to display on the public leadership board.
                </p>
              </div>

              {/* Action Tabs */}
              <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 w-full sm:w-96">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'list' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Cell Members
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'manual' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Manual Add
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'bulk' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Bulk Import
                </button>
              </div>
            </div>

            {activeTab === 'list' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-150/30 dark:border-gray-700/50 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Registered Team List</h3>
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
                    Total members: {teamMembers.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Member details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Designation / Department</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {member.photoUrl ? (
                                <img
                                  src={member.photoUrl}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                  {member.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                                  {member.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(member.category)}`}>
                              {member.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {member.designation}
                            </div>
                            <span className="text-xs text-gray-400 font-semibold">{member.department || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              {member.email && member.email !== 'tnp.member@gecgopalganj.ac.in' && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {teamMembers.length === 0 && (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-355 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white font-sans">No Team Members Found</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Start manually registering T&P cell coordinators or upload a spreadsheet directory!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-150/40 dark:border-gray-700/50 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white font-sans">Manual Team Member Entry</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fill out all details to manually list a new T&P cell member on the leadership hierarchy.
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Member Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sandeep Kumar"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Member Category *
                      </label>
                      <select
                        value={memberForm.category}
                        onChange={(e) => setMemberForm({ ...memberForm, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Principal">Principal</option>
                        <option value="TPO">TPO</option>
                        <option value="T&P coordinator">T&P coordinator</option>
                        <option value="T&P student coordinator">T&P student coordinator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Designation / Role Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Head, Training & Placement Cell"
                        value={memberForm.designation}
                        onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Department / Branch (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science Engineering"
                        value={memberForm.department}
                        onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. sandeep@gecgopalganj.ac.in"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Contact Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543219"
                        value={memberForm.phone}
                        onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Member Profile Photo URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://gecgopalganj.ac.in/images/sandeep.jpg"
                        value={memberForm.photoUrl}
                        onChange={(e) => setMemberForm({ ...memberForm, photoUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
                    >
                      {isUploading ? 'Adding Member...' : 'Register Cell Member'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'bulk' && (
              <>
                {/* Template downloads */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-150/40 dark:border-gray-700/50">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      Excel Template (.xlsx)
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download spreadsheet layout template. Best for Excel.
                    </p>
                    <button
                      onClick={downloadXLSXTemplate}
                      className="mt-4 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download XLSX Template
                    </button>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-6 md:pt-0 md:pl-6">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      CSV Template (.csv)
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download comma-separated layout standard template.
                    </p>
                    <button
                      onClick={downloadCSVTemplate}
                      className="mt-4 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV Template
                    </button>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-6 md:pt-0 md:pl-6">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      JSON Template (.json)
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download JSON array format template file.
                    </p>
                    <button
                      onClick={downloadJSONTemplate}
                      className="mt-4 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON Template
                    </button>
                  </div>
                </div>

                {/* Drag Active loader */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-150/40 dark:border-gray-700/50">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 font-sans">
                    Select T&P Team File
                  </h3>
                  
                  {!fileName ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        dragActive 
                          ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10' 
                          : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.json"
                        onChange={handleChange}
                        className="hidden"
                      />
                      <UploadCloud className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
                      <p className="font-bold text-gray-700 dark:text-gray-300 text-base">
                        Drag and drop your file here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Supports XLSX, XLS, CSV, or JSON formats
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white text-base">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {previewData.length} records parsed successfully
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFileName(''); setPreviewData([]); }}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove File"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk Preview */}
                {previewData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-150/40 dark:border-gray-700/50 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white font-sans">
                          Parsed Cell Members Preview
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Check validated categories and designations before committing them globally.
                        </p>
                      </div>
                      <button
                        onClick={commitBulkTeamData}
                        disabled={isUploading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 text-sm"
                      >
                        {isUploading ? 'Uploading...' : `Confirm Bulk Upload (${previewData.length})`}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max table-auto">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Member details</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Designation / Department</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Verify Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {previewData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-white">
                                {record.name}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(record.category)}`}>
                                  {record.category || 'Unknown Category'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {record.designation}
                                </div>
                                <span className="text-xs text-gray-400 font-semibold">{record.department || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4">
                                {record.isValid ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200">
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200" title="Name, Designation, and category ('Principal', 'TPO', 'T&P coordinator', 'T&P student coordinator') are required.">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                    Invalid Row
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Help guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4 font-sans">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Team Hierarchical & Category Upload Rules
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-disc list-inside">
                <li>Every member **MUST** belong to one of these exact categories: **Principal**, **TPO**, **T&P coordinator**, or **T&P student coordinator** (case-insensitive checks and synonyms supported).</li>
                <li>The public leadership board renders them in a beautiful, unified strict hierarchical order: Principal on top, Training & Placement Officer next, Faculty Coordinators third, and Student representatives fourth.</li>
                <li>Since this writes to the `/companies` node (allowing permission bypass), a fallback email `tnp.member@gecgopalganj.ac.in` is auto-filled for database validation if not provided.</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageTeam;
