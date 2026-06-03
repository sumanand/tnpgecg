import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, set, update, push, child } from 'firebase/database';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Download, 
  Check, 
  Trash2, 
  Play, 
  Layers, 
  Users, 
  UserPlus, 
  Award,
  Hash,
  Star,
  Book,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

const BulkUploadStudents = () => {
  const [existingStudents, setExistingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('bulk'); // 'bulk' or 'manual'
  const fileInputRef = useRef(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
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
    loadExistingStudents();
  }, []);

  const loadExistingStudents = async () => {
    try {
      const studentsSnap = await get(ref(db, 'students'));
      const list = [];
      if (studentsSnap.exists()) {
        studentsSnap.forEach((childSnap) => {
          list.push({ id: childSnap.key, ...childSnap.val() });
        });
      }
      setExistingStudents(list);
      setLoading(false);
    } catch (err) {
      console.error("Error loading existing students:", err);
      toast.error("Failed to load existing student records.");
      setLoading(false);
    }
  };

  // Branch Normalization for Student profiles
  const normalizeBranchForStudent = (branchStr) => {
    if (!branchStr) return '';
    const clean = branchStr.trim().toLowerCase().replace(/[\s&_-]+/g, '');
    
    if (clean.includes('computerscience') || clean.includes('cse') || clean.includes('cs')) {
      if (clean.includes('iot')) return 'CSE(IOT)';
      return 'CSE (Ai)'; // Default CSE
    }
    if (clean.includes('electrical') || clean === 'ee') {
      return 'Electrical engineering (EE)';
    }
    if (clean.includes('civil') || clean === 'ce') {
      return 'civil';
    }
    if (clean.includes('mechanical') || clean === 'me') {
      return 'mechanical';
    }
    if (clean.includes('electronics') || clean.includes('ece') || clean.includes('vlsi') || clean.includes('communication')) {
      return 'Electronics and communication (vlsi)';
    }
    if (clean.includes('aeronautical') || clean.includes('ae') || clean.includes('aeraunatical')) {
      return 'aeraunatical';
    }
    return branchStr.trim(); // fallback
  };

  // Templates Downloads
  const downloadXLSXTemplate = () => {
    const data = [
      {
        "name": "Amit Kumar",
        "rollNo": "220101",
        "email": "amit.cse22@gecgopalganj.ac.in",
        "branch": "Electrical Engineering",
        "cgpa": 8.45,
        "phone": "9876543210",
        "passingYear": "2026",
        "registrationNo": "GECG/2022/EE/05",
        "class10": 85.50,
        "class12": 91.20
      },
      {
        "name": "Riya Kumari",
        "rollNo": "220102",
        "email": "riya.ece22@gecgopalganj.ac.in",
        "branch": "COMPUTER SCIENCE ENGINEERING",
        "cgpa": 7.89,
        "phone": "9876543211",
        "passingYear": "2026",
        "registrationNo": "GECG/2022/CSE/12",
        "class10": 88.00,
        "class12": 84.50
      },
      {
        "name": "Karan Kumar",
        "rollNo": "220103",
        "email": "karan.ce22@gecgopalganj.ac.in",
        "branch": "Civil Engineer ing",
        "cgpa": 8.12,
        "phone": "9876543212",
        "passingYear": "2026",
        "registrationNo": "GECG/2022/CE/09",
        "class10": 82.30,
        "class12": 85.60
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_onboarding_template.xlsx");
    toast.success("Excel template download started");
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "name,rollNo,email,branch,cgpa,phone,passingYear,registrationNo,class10,class12\n"
      + "Amit Kumar,220101,amit.cse22@gecgopalganj.ac.in,Electrical Engineering,8.45,9876543210,2026,GECG/2022/EE/05,85.50,91.20\n"
      + "Riya Kumari,220102,riya.ece22@gecgopalganj.ac.in,COMPUTER SCIENCE ENGINEERING,7.89,9876543211,2026,GECG/2022/CSE/12,88.00,84.50\n"
      + "Karan Kumar,220103,karan.ce22@gecgopalganj.ac.in,Civil Engineer ing,8.12,9876543212,2026,GECG/2022/CE/09,82.30,85.60";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_onboarding_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template download started");
  };

  const downloadJSONTemplate = () => {
    const jsonContent = [
      {
        "name": "Amit Kumar",
        "rollNo": "220101",
        "email": "amit.cse22@gecgopalganj.ac.in",
        "branch": "Electrical Engineering",
        "cgpa": 8.45,
        "phone": "9876543210",
        "passingYear": "2026",
        "registrationNo": "GECG/2022/EE/05",
        "class10": 85.50,
        "class12": 91.20
      },
      {
        "name": "Riya Kumari",
        "rollNo": "220102",
        "email": "riya.ece22@gecgopalganj.ac.in",
        "branch": "COMPUTER SCIENCE ENGINEERING",
        "cgpa": 7.89,
        "phone": "9876543211",
        "passingYear": "2026",
        "registrationNo": "GECG/2022/CSE/12",
        "class10": 88.00,
        "class12": 84.50
      }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonContent, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "student_onboarding_template.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON template download started");
  };

  // CSV Reader
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
        let key = header;
        // Synonym resolutions
        const normHeader = header.toLowerCase().replace(/[\s_]/g, '');
        if (normHeader === 'roll' || normHeader === 'rollno' || normHeader === 'rollnumber') key = 'rollNo';
        if (normHeader === 'emailaddress') key = 'email';
        if (normHeader === 'fullname' || normHeader === 'studentname') key = 'name';
        if (normHeader === 'gpa' || normHeader === 'marks') key = 'cgpa';
        if (normHeader === 'passingyear' || normHeader === 'batch') key = 'passingYear';
        if (normHeader === 'registration' || normHeader === 'regno' || normHeader === 'registrationno') key = 'registrationNo';
        if (normHeader === 'class10percentage' || normHeader === 'matric') key = 'class10';
        if (normHeader === 'class12percentage' || normHeader === 'inter' || normHeader === 'diploma') key = 'class12';
        
        record[key] = values[index] || '';
      });
      
      if (record.rollNo || record.email || record.name) {
        parsedData.push(record);
      }
    }
    return parsedData;
  };

  // Process & Validate Records
  const processUploadedRecords = (rawData) => {
    if (!rawData || rawData.length === 0) {
      toast.error("No valid records found in the uploaded file.");
      return;
    }

    const processed = rawData.map((row) => {
      const record = {};
      
      // Resolve column synonym mappings
      Object.keys(row).forEach((key) => {
        const normKey = key.trim().toLowerCase().replace(/[\s_]/g, '');
        let standardKey = key.trim();
        
        if (normKey === 'name' || normKey === 'fullname' || normKey === 'studentname') standardKey = 'name';
        else if (normKey === 'roll' || normKey === 'rollno' || normKey === 'rollnumber' || normKey === 'collegeroll') standardKey = 'rollNo';
        else if (normKey === 'email' || normKey === 'emailaddress') standardKey = 'email';
        else if (normKey === 'branch' || normKey === 'studentbranch' || normKey === 'department') standardKey = 'branch';
        else if (normKey === 'cgpa' || normKey === 'gpa') standardKey = 'cgpa';
        else if (normKey === 'phone' || normKey === 'mobile' || normKey === 'contact') standardKey = 'phone';
        else if (normKey === 'passingyear' || normKey === 'year' || normKey === 'batch') standardKey = 'passingYear';
        else if (normKey === 'registrationno' || normKey === 'regno' || normKey === 'registration') standardKey = 'registrationNo';
        else if (normKey === 'class10' || normKey === 'class10th' || normKey === 'matric') standardKey = 'class10';
        else if (normKey === 'class12' || normKey === 'class12th' || normKey === 'inter' || normKey === 'diploma') standardKey = 'class12';

        record[standardKey] = row[key];
      });

      // Normalize branch
      const rawBranch = record.branch || '';
      const normalizedBranch = normalizeBranchForStudent(rawBranch);

      // Validate email, cgpa, etc.
      const cgpaVal = parseFloat(record.cgpa) || 0;
      const isValidCGPA = cgpaVal >= 0 && cgpaVal <= 10;
      const emailVal = record.email || '';
      const isValidEmail = emailVal.includes('@');
      
      // Check duplicate against live database
      const isAlreadyRegistered = existingStudents.some(s => 
        (record.rollNo && String(s.rollNo) === String(record.rollNo)) ||
        (record.email && String(s.email).toLowerCase() === String(record.email).toLowerCase())
      );

      return {
        ...record,
        branch: normalizedBranch,
        cgpa: cgpaVal,
        class10: parseFloat(record.class10) || '',
        class12: parseFloat(record.class12) || '',
        status: isAlreadyRegistered ? 'update' : 'new',
        isValid: record.name && record.rollNo && isValidEmail && isValidCGPA && record.passingYear
      };
    });

    setPreviewData(processed);
    toast.success(`Successfully parsed & validated ${processed.length} student records.`);
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
          toast.error("Error parsing Excel file.");
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
          toast.error("Error parsing file.");
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

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFileName('');
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Commit Students bulk import to Database under imported roll-number paths
  const commitStudentData = async () => {
    if (previewData.length === 0) return;
    
    const invalidCount = previewData.filter(r => !r.isValid).length;
    if (invalidCount > 0) {
      if (!window.confirm(`There are ${invalidCount} invalid rows in your data. They will be skipped. Do you wish to proceed?`)) {
        return;
      }
    }

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const record of previewData) {
        if (!record.isValid) continue;

        // Predictable UID format for imported profiles: e.g. imported_roll_220101
        const customUid = `imported_roll_${record.rollNo}`;
        
        const studentPayload = {
          name: record.name,
          rollNo: record.rollNo,
          email: record.email.toLowerCase(),
          branch: record.branch || 'CSE (Ai)',
          cgpa: parseFloat(record.cgpa) || 0,
          phone: record.phone || '',
          passingYear: String(record.passingYear),
          registrationNo: record.registrationNo || '',
          class10: record.class10 ? parseFloat(record.class10) : '',
          class12: record.class12 ? parseFloat(record.class12) : '',
          skills: [],
          role: 'student',
          emailVerified: false,
          profileComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const userPayload = {
          uid: customUid,
          name: record.name,
          email: record.email.toLowerCase(),
          role: 'student',
          createdAt: new Date().toISOString()
        };

        // 1. Write to /students
        await set(ref(db, `students/${customUid}`), studentPayload);

        // 2. Write to /users
        await set(ref(db, `users/${customUid}`), userPayload);
        
        successCount++;
      }

      toast.success(`Success! Pre-populated & uploaded ${successCount} student profiles.`);
      removeFile();
      loadExistingStudents();
    } catch (err) {
      console.error("Error committing students data:", err);
      toast.error("Database writing error. Verify Firebase permissions.");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Manual Form
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.rollNo || !manualForm.email || !manualForm.branch || !manualForm.cgpa || !manualForm.passingYear) {
      toast.error("Please fill in all required (*) fields.");
      return;
    }

    const cgpaVal = parseFloat(manualForm.cgpa) || 0;
    if (cgpaVal < 0 || cgpaVal > 10) {
      toast.error("CGPA must be between 0.00 and 10.00");
      return;
    }

    setIsUploading(true);
    const customUid = `imported_roll_${manualForm.rollNo}`;

    try {
      const studentPayload = {
        name: manualForm.name,
        rollNo: manualForm.rollNo,
        email: manualForm.email.toLowerCase(),
        branch: manualForm.branch,
        cgpa: cgpaVal,
        phone: manualForm.phone || '',
        passingYear: String(manualForm.passingYear),
        registrationNo: manualForm.registrationNo || '',
        class10: manualForm.class10 ? parseFloat(manualForm.class10) : '',
        class12: manualForm.class12 ? parseFloat(manualForm.class12) : '',
        skills: [],
        role: 'student',
        emailVerified: false,
        profileComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const userPayload = {
        uid: customUid,
        name: manualForm.name,
        email: manualForm.email.toLowerCase(),
        role: 'student',
        createdAt: new Date().toISOString()
      };

      await set(ref(db, `students/${customUid}`), studentPayload);
      await set(ref(db, `users/${customUid}`), userPayload);

      toast.success(`Student ${manualForm.name} registered successfully!`);
      
      // Reset form
      setManualForm({
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
      loadExistingStudents();
    } catch (err) {
      console.error(err);
      toast.error("Database upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Student Onboarding Portal" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header intro */}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                Student Directory Registration Portal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Pre-populate student database records to allow instant notice matchings, eligibility check validation, and placements. Students will merge profiles seamlessly when they sign up with their roll numbers later.
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 w-full sm:w-96">
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'bulk' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Bulk File Upload
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'manual' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Manual Form
              </button>
            </div>

            {activeTab === 'bulk' ? (
              <>
                {/* Templates Downloads Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      Excel Template (.xlsx)
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download pre-configured Excel layout with standard columns.
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
                      Download standard JSON array format template file.
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

                {/* Drag and Drop Zone */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    Select Students File
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
                      <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">
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
                        onClick={removeFile}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove File"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview Grid Table */}
                {previewData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          Onboarding Student Directory Preview
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Verify data validations and normalized branches before committing student profiles to the database.
                        </p>
                      </div>
                      <button
                        onClick={commitStudentData}
                        disabled={isUploading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            Confirm Bulk Import ({previewData.length})
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max table-auto">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Roll No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Branch / Dept</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">CGPA</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Passing Year</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Verify Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {previewData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {record.name || 'Missing Name'}
                                  </span>
                                  <span className="text-xs text-gray-400">{record.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {record.rollNo || 'Missing Roll'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                {record.branch || 'General'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-semibold ${!record.isValid ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                  {record.cgpa}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                {record.passingYear || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                {!record.isValid ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                    Invalid Entry
                                  </span>
                                ) : record.status === 'update' ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200">
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Already Exists (Will Overwrite)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    New Profile
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
            ) : (
              /* Manual Onboarding Form */
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Manual Student Entry
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fill out all details to manually create a pre-populated student profile.
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amit Kumar"
                        value={manualForm.name}
                        onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. amit.cse22@gecgopalganj.ac.in"
                        value={manualForm.email}
                        onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 220101"
                        value={manualForm.rollNo}
                        onChange={(e) => setManualForm({ ...manualForm, rollNo: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Branch / Department *
                      </label>
                      <select
                        value={manualForm.branch}
                        onChange={(e) => setManualForm({ ...manualForm, branch: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        CGPA *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g. 8.45"
                        value={manualForm.cgpa}
                        onChange={(e) => setManualForm({ ...manualForm, cgpa: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Passing Year *
                      </label>
                      <select
                        value={manualForm.passingYear}
                        onChange={(e) => setManualForm({ ...manualForm, passingYear: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={manualForm.phone}
                        onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Registration Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GECG/2022/EE/05"
                        value={manualForm.registrationNo}
                        onChange={(e) => setManualForm({ ...manualForm, registrationNo: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Class 10th Percentage (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 85.50"
                        value={manualForm.class10}
                        onChange={(e) => setManualForm({ ...manualForm, class10: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Class 12th / Diploma (%/GPA - Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 91.20"
                        value={manualForm.class12}
                        onChange={(e) => setManualForm({ ...manualForm, class12: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Registering...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Register Student Record
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Guide Info Blocks */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Onboarding & Branch Matching Guidelines
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-disc list-inside">
                <li>Required bulk fields are: **name**, **rollNo**, **email**, **branch**, **cgpa**, **passingYear**. Optional fields like class 10/12 details are supported.</li>
                <li>Branch columns with values like `"Electrical Engineering"` are automatically standardized to `"Electrical engineering (EE)"`, `"COMPUTER SCIENCE ENGINEERING"` to `"CSE (Ai)"`, and `"Civil Engineer ing"` to `"civil"`.</li>
                <li>When these students later sign up via `/register` using their roll number or email, the system will **automatically merge** their historical details (like previous placements, class percentages, and pre-set CGPA) and delete this temporary imported node cleanly.</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default BulkUploadStudents;
