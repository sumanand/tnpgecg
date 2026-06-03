import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, set, push, child } from 'firebase/database';
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
  Building 
} from 'lucide-react';

const BulkUploadPlacements = () => {
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      // Fetch students list
      const studentsSnap = await get(ref(db, 'students'));
      const studentsList = [];
      if (studentsSnap.exists()) {
        studentsSnap.forEach((child) => {
          studentsList.push({ uid: child.key, ...child.val() });
        });
      }
      setStudents(studentsList);
      
      // Fetch placement and internship drives list
      const [placementsSnap, internshipsSnap] = await Promise.all([
        get(ref(db, 'placement_drives')),
        get(ref(db, 'internship_drives'))
      ]);
      
      const drivesList = [];
      if (placementsSnap.exists()) {
        placementsSnap.forEach(c => drivesList.push({ id: c.key, type: 'placement', ...c.val() }));
      }
      if (internshipsSnap.exists()) {
        internshipsSnap.forEach(c => drivesList.push({ id: c.key, type: 'internship', ...c.val() }));
      }
      setDrives(drivesList);
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading uploader metadata:", err);
      toast.error("Failed to load student profiles metadata.");
      setLoading(false);
    }
  };

  // Download Templates Helpers
  const downloadXLSXTemplate = () => {
    const data = [
      {
        "rollNo": "220101",
        "email": "amit.cse22@gecgopalganj.ac.in",
        "name": "Amit Kumar",
        "company": "Tech Mahindra",
        "role": "Software Engineer Trainee",
        "package": "5.5 LPA",
        "date": "2026-05-30",
        "type": "placement",
        "joiningDate": "2026-07-15",
        "bond": "1 Year"
      },
      {
        "rollNo": "220102",
        "email": "riya.ece22@gecgopalganj.ac.in",
        "name": "Riya Kumari",
        "company": "TCS",
        "role": "Assistant System Engineer",
        "package": "4.5 LPA",
        "date": "2026-05-28",
        "type": "placement",
        "joiningDate": "2026-08-01",
        "bond": ""
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placements");
    XLSX.writeFile(workbook, "placement_history_template.xlsx");
    toast.success("Excel template download started");
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "rollNo,email,name,company,role,package,date,type,joiningDate,bond\n"
      + "220101,amit.cse22@gecgopalganj.ac.in,Amit Kumar,Tech Mahindra,Software Engineer Trainee,5.5 LPA,2026-05-30,placement,2026-07-15,1 Year\n"
      + "220102,riya.ece22@gecgopalganj.ac.in,Riya Kumari,TCS,Assistant System Engineer,4.5 LPA,2026-05-28,placement,2026-08-01,\n"
      + "230105,priya.cse23@gecgopalganj.ac.in,Anjali Priya,Cognizant,Software Developer Intern,35000 / month,2026-05-25,internship,2026-06-15,None";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "placement_history_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template download started");
  };

  const downloadJSONTemplate = () => {
    const jsonContent = [
      {
        "rollNo": "220101",
        "email": "amit.cse22@gecgopalganj.ac.in",
        "name": "Amit Kumar",
        "company": "Tech Mahindra",
        "role": "Software Engineer Trainee",
        "package": "5.5 LPA",
        "date": "2026-05-30",
        "type": "placement",
        "joiningDate": "2026-07-15",
        "bond": "1 Year"
      },
      {
        "rollNo": "220102",
        "email": "riya.ece22@gecgopalganj.ac.in",
        "name": "Riya Kumari",
        "company": "TCS",
        "role": "Assistant System Engineer",
        "package": "4.5 LPA",
        "date": "2026-05-28",
        "type": "placement",
        "joiningDate": "2026-08-01",
        "bond": ""
      }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonContent, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "placement_history_template.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON template download started");
  };

  // CSV Reader
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Normalize headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const parsedData = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const record = {};
      
      headers.forEach((header, index) => {
        // Map synonyms
        let key = header;
        if (header.toLowerCase() === 'roll' || header.toLowerCase() === 'rollnumber') key = 'rollNo';
        if (header.toLowerCase() === 'emailaddress') key = 'email';
        if (header.toLowerCase() === 'ctc' || header.toLowerCase() === 'stipend') key = 'package';
        
        record[key] = values[index] || '';
      });
      
      if (record.rollNo || record.email || record.name) {
        parsedData.push(record);
      }
    }
    return parsedData;
  };

  // Match Uploader Data
  const processUploadedRecords = (rawData) => {
    if (!rawData || rawData.length === 0) {
      toast.error("No valid records found in the uploaded file.");
      return;
    }

    const normalizeBranchName = (branchStr) => {
      if (!branchStr) return 'General';
      const raw = String(branchStr).trim().toUpperCase();
      
      // Explicit exact checks for user specifications
      if (raw === 'ELECTRICAL ENGINEERING' || raw === 'EE' || raw.includes('ELECTRICAL')) {
        return 'EE';
      }
      if (raw === 'COMPUTER SCIENCE ENGINEERING' || raw === 'CSE' || raw.includes('COMPUTER SCIENCE')) {
        return 'CSE';
      }
      if (raw.replace(/\s+/g, '') === 'CIVILENGINEERING' || raw === 'CE' || raw.includes('CIVIL')) {
        return 'CE';
      }
      
      const clean = branchStr.trim().toLowerCase().replace(/[\s&_-]+/g, '');
      
      if (clean.includes('computerscience') || clean.includes('cse') || clean.includes('cs')) {
        return 'CSE';
      }
      if (clean.includes('electrical') || clean === 'ee') {
        return 'EE';
      }
      if (clean.includes('civil') || clean === 'ce') {
        return 'CE';
      }
      if (clean.includes('mechanical') || clean === 'me') {
        return 'ME';
      }
      if (clean.includes('electronics') || clean.includes('ece') || clean.includes('vlsi') || clean.includes('communication')) {
        return 'ECE';
      }
      if (clean.includes('aeronautical') || clean.includes('ae')) {
        return 'AE';
      }
      return branchStr.trim(); // Fallback to raw string if no standard match
    };

    const processed = rawData.map(row => {
      // Normalize row keys to handle casing, spaces, and synonyms
      const record = {};
      Object.keys(row).forEach(key => {
        const normKey = key.trim().toLowerCase();
        let standardKey = key.trim();
        
        if (normKey === 'name' || normKey === 'studentname' || normKey === 'student name') standardKey = 'name';
        else if (normKey === 'branch' || normKey === 'studentbranch' || normKey === 'student branch') standardKey = 'branch';
        else if (normKey === 'company' || normKey === 'recruiter') standardKey = 'company';
        else if (normKey === 'package' || normKey === 'ctc' || normKey === 'salary' || normKey === 'stipend') standardKey = 'package';
        else if (normKey === 'role' || normKey === 'position' || normKey === 'designation') standardKey = 'role';
        else if (normKey === 'roll' || normKey === 'rollno' || normKey === 'roll number') standardKey = 'rollNo';
        else if (normKey === 'email' || normKey === 'emailaddress' || normKey === 'email address') standardKey = 'email';
        else if (normKey === 'date' || normKey === 'selecteddate' || normKey === 'selected date' || normKey === 'selection date') standardKey = 'date';
        
        record[standardKey] = row[key];
      });

      // 1. Resolve registered student UID by matching rollNo or email
      const matchedStudent = students.find(s => 
        (record.rollNo && String(s.rollNo) === String(record.rollNo)) ||
        (record.rollNo && String(s.collegeRollNo) === String(record.rollNo)) ||
        (record.email && String(s.email).toLowerCase() === String(record.email).toLowerCase())
      );
      
      // 2. Try matching active drives
      const matchedDrive = drives.find(d => 
        String(d.company).toLowerCase() === String(record.company).toLowerCase() &&
        d.type === (record.type || 'placement')
      );
      
      const rawBranch = matchedStudent ? (matchedStudent.branch || 'CSE') : record.branch || 'General';
      const normalizedBranch = normalizeBranchName(rawBranch);

      return {
        ...record,
        studentId: matchedStudent ? matchedStudent.uid : 'historic-log',
        studentName: matchedStudent ? matchedStudent.name : record.name || 'Unregistered Historic Student',
        studentBranch: normalizedBranch,
        driveId: matchedDrive ? matchedDrive.id : 'direct-record',
        companyId: matchedDrive ? (matchedDrive.companyId || 'direct-import') : 'direct-import',
        status: matchedStudent ? 'matched' : 'historic'
      };
    });

    setPreviewData(processed);
    toast.success(`Successfully parsed ${processed.length} placement records.`);
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    
    // Check if Excel sheet
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert sheet to JSON array
          const rawJSON = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          console.log("Raw Excel JSON parsed:", rawJSON);
          
          // Process raw records
          processUploadedRecords(rawJSON);
        } catch (err) {
          console.error("Error reading Excel file:", err);
          toast.error("Error parsing Excel file. Please verify formatting.");
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
            toast.error("Unsupported file format. Please upload XLSX, CSV or JSON.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error parsing the file. Please verify formatting.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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

  // Commit to Firebase Realtime Database
  const commitPlacementData = async () => {
    if (previewData.length === 0) return;
    setIsUploading(true);
    
    try {
      let successCount = 0;
      
      for (const record of previewData) {
        const selectionKey = push(child(ref(db), 'selected_students')).key;
        
        const payload = {
          company: record.company || 'Unknown Company',
          role: record.role || 'Selected Graduate',
          position: record.role || 'Selected Graduate', // Map 'role' to 'position' to satisfy security rules check
          companyId: record.companyId || 'direct-import', // Map 'companyId' to satisfy security rules check
          package: record.package || 'N/A',
          selectedAt: record.date || new Date().toISOString().slice(0, 10),
          joiningDate: record.joiningDate || '',
          bond: record.bond || '',
          driveId: record.driveId || 'direct-record',
          driveType: record.type || 'placement',
          studentId: record.studentId,
          studentName: record.studentName,
          branch: record.studentBranch || 'General Engineering' // Save resolved or parsed branch
        };

        // 1. Save to global selected_students nodes
        await set(ref(db, `selected_students/${selectionKey}`), payload);
        
        // 2. If mapped to a registered student, also sync in the student's node (wrapped to handle DB rule permissions gracefully)
        if (record.studentId && record.studentId !== 'historic-log') {
          try {
            const studentSelectionRef = ref(db, `students/${record.studentId}/placements/${selectionKey}`);
            await set(studentSelectionRef, {
              company: payload.company,
              role: payload.role,
              package: payload.package,
              selectedAt: payload.selectedAt,
              driveType: payload.driveType
            });
          } catch (syncErr) {
            console.warn("Could not sync directly to student profile node (usually due to database security rules), skipped direct sync. Record is safely committed globally:", syncErr.message);
          }
        }
        successCount++;
      }
      
      toast.success(`Success! Bulk uploaded ${successCount} placement history records.`);
      removeFile();
    } catch (err) {
      console.error("Error committing records:", err);
      toast.error("Error committing records to the database.");
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
        <Header title="Bulk Upload Placements" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Intro Title */}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                Bulk Upload Placements & History
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Import placement records in bulk using standard Excel (XLSX/XLS), CSV, or JSON file formats. The portal will automatically map candidate roll numbers or emails against registered students for perfect profile syncing.
              </p>
            </div>

            {/* Template Downloads Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  Excel Template (.xlsx)
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Download structured native Excel sheet. Perfect for Microsoft Excel users.
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Download standard comma-separated sheet template. Lightweight and standard.
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Download JSON template file. Perfect for database logs migrations.
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

            {/* Drag & Drop File Loader Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Select Placement File
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

            {/* Interactive Preview Table Grid */}
            {previewData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Parsed Placement History Preview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Check the matched student mapping and placements info before committing changes to the database.
                    </p>
                  </div>
                  <button
                    onClick={commitPlacementData}
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
                        Confirm Bulk Upload ({previewData.length})
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Candidate info</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Match Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {previewData.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {record.studentName}
                              </span>
                              <span className="text-xs text-gray-400">
                                Roll: {record.rollNo || 'N/A'} | {record.email || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {record.company}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {record.role}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                            {record.package}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              record.type === 'internship'
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-100'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100'
                            }`}>
                              {record.type || 'placement'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {record.status === 'matched' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800">
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Synced Candidate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800" title="This will be uploaded as historic placement log and won't link to a live active profile">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                Historic Log Only
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
            
            {/* Guide Info Blocks */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Upload Guidelines & Mapping Rules
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-disc list-inside">
                <li>Make sure spreadsheet values have headers matching the CSV template exactly (case-insensitive synonyms like CTC for package, Roll Number for rollNo are supported).</li>
                <li>Make sure date strings are in standard YYYY-MM-DD format (e.g. 2026-05-30).</li>
                <li>Historic Log Only records are perfect for archiving old placements from past batches (like Class of 2024 or earlier) who may not have registered profiles inside the TNP portal.</li>
                <li>Synced Candidates will automatically see their selection records loaded in their respective dashboards immediately.</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default BulkUploadPlacements;
