import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db } from '../../firebase/config';
import { ref, get, set, remove, push, child } from 'firebase/database';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  Building, 
  Plus, 
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
  Globe,
  PlusCircle
} from 'lucide-react';

const ManageRecruiters = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'manual', or 'bulk'
  
  // Bulk upload states
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Recruiter Form State
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
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const companiesRef = ref(db, 'companies');
      const snapshot = await get(companiesRef);
      const list = [];
      if (snapshot.exists()) {
        snapshot.forEach((c) => {
          const val = c.val();
          if (val.isRecruiter === true) {
            list.push({ id: c.key, ...val });
          }
        });
      }
      setRecruiters(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recruiter partners.");
      setLoading(false);
    }
  };

  const handleDeleteRecruiter = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete recruiter partner ${name}? This will remove them from the homepage ticker.`)) {
      try {
        await remove(ref(db, `companies/${id}`));
        toast.success(`Removed recruiter ${name} successfully!`);
        fetchRecruiters();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete recruiter partner.");
      }
    }
  };

  // Templates Downloads
  const downloadXLSXTemplate = () => {
    const data = [
      {
        "name": "Tech Mahindra",
        "industry": "IT/Software",
        "website": "https://techmahindra.com",
        "logoUrl": "https://logo.clearbit.com/techmahindra.com",
        "email": "hr@techmahindra.com",
        "phone": "",
        "address": "Pune, India"
      },
      {
        "name": "Tata Motors",
        "industry": "Automotive",
        "website": "https://tatamotors.com",
        "logoUrl": "https://logo.clearbit.com/tatamotors.com",
        "email": "hr@tatamotors.com",
        "phone": "",
        "address": "Mumbai, India"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recruiters");
    XLSX.writeFile(workbook, "recruiter_partners_template.xlsx");
    toast.success("Excel template download started");
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "name,industry,website,logoUrl,email,phone,address\n"
      + "Tech Mahindra,IT/Software,https://techmahindra.com,https://logo.clearbit.com/techmahindra.com,hr@techmahindra.com,,Pune\n"
      + "Tata Motors,Automotive,https://tatamotors.com,https://logo.clearbit.com/tatamotors.com,hr@tatamotors.com,,Mumbai";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recruiter_partners_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template download started");
  };

  const downloadJSONTemplate = () => {
    const jsonContent = [
      {
        "name": "Tech Mahindra",
        "industry": "IT/Software",
        "website": "https://techmahindra.com",
        "logoUrl": "https://logo.clearbit.com/techmahindra.com",
        "email": "hr@techmahindra.com"
      }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonContent, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "recruiter_partners_template.json");
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
      
      if (record.name) {
        parsedData.push(record);
      }
    }
    return parsedData;
  };

  const processUploadedRecords = (rawData) => {
    if (!rawData || rawData.length === 0) {
      toast.error("No valid partner records found.");
      return;
    }
    
    const processed = rawData.map(row => {
      const record = {};
      Object.keys(row).forEach(key => {
        const normKey = key.trim().toLowerCase();
        let stdKey = key.trim();
        if (normKey === 'name') stdKey = 'name';
        else if (normKey === 'industry' || normKey === 'domain') stdKey = 'industry';
        else if (normKey === 'website' || normKey === 'url') stdKey = 'website';
        else if (normKey === 'logo' || normKey === 'logourl') stdKey = 'logoUrl';
        else if (normKey === 'email') stdKey = 'email';
        else if (normKey === 'phone' || normKey === 'contact') stdKey = 'phone';
        else if (normKey === 'address') stdKey = 'address';
        else if (normKey === 'description') stdKey = 'description';
        
        record[stdKey] = row[key];
      });

      return {
        ...record,
        isValid: record.name ? true : false
      };
    });

    setPreviewData(processed);
    toast.success(`Successfully parsed ${processed.length} recruiter records.`);
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

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!recruiterForm.name) {
      toast.error("Please fill in the Recruiter Company Name.");
      return;
    }

    setIsUploading(true);
    try {
      const newKey = push(child(ref(db), 'companies')).key;
      const customId = `recruiter_partner_${newKey}`;
      
      const payload = {
        id: customId,
        name: recruiterForm.name,
        industry: recruiterForm.industry || 'General IT/Software',
        website: recruiterForm.website || '',
        logoUrl: recruiterForm.logoUrl || '',
        email: (recruiterForm.email || 'recruiter@company.com').toLowerCase(), // Required for companies rule validation
        phone: recruiterForm.phone || '',
        address: recruiterForm.address || '',
        description: recruiterForm.description || '',
        isRecruiter: true,
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      await set(ref(db, `companies/${customId}`), payload);
      toast.success(`${recruiterForm.name} added successfully!`);
      
      setRecruiterForm({
        name: '',
        industry: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        description: '',
        logoUrl: ''
      });
      setActiveTab('list');
      fetchRecruiters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add recruiter to database.");
    } finally {
      setIsUploading(false);
    }
  };

  const commitBulkRecruitersData = async () => {
    if (previewData.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    try {
      for (const rec of previewData) {
        if (!rec.isValid) continue;

        const newKey = push(child(ref(db), 'companies')).key;
        const customId = `recruiter_partner_${newKey}`;
        
        const payload = {
          id: customId,
          name: rec.name,
          industry: rec.industry || 'General IT/Software',
          website: rec.website || '',
          logoUrl: rec.logoUrl || '',
          email: (rec.email || 'recruiter@company.com').toLowerCase(), // Required for database validation rules
          phone: rec.phone || '',
          address: rec.address || '',
          description: rec.description || '',
          isRecruiter: true,
          status: 'approved',
          createdAt: new Date().toISOString()
        };

        await set(ref(db, `companies/${customId}`), payload);
        successCount++;
      }

      toast.success(`Uploaded ${successCount} recruiter partners successfully!`);
      setFileName('');
      setPreviewData([]);
      setActiveTab('list');
      fetchRecruiters();
    } catch (err) {
      console.error(err);
      toast.error("Database writing error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Manage Recruiter Partners" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header intro */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white font-sans">
                  Homepage Recruiter Partners
                </h2>
                <p className="text-gray-650 dark:text-gray-400 mt-2 text-sm">
                  Register, edit, and delete partner recruiter brand logos to show directly on the public homepage ticker block.
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
                  Partners list
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
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Active Partners</h3>
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
                    Total: {recruiters.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recruiters.map((rec) => (
                    <div 
                      key={rec.id}
                      className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between items-center text-center relative hover:shadow-md transition-shadow group h-48"
                    >
                      <button
                        onClick={() => handleDeleteRecruiter(rec.id, rec.name)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Recruiter"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>

                      <div className="flex flex-col items-center justify-center flex-grow space-y-3">
                        {rec.logoUrl ? (
                          <img
                            src={rec.logoUrl}
                            alt={rec.name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            className="h-10 object-contain max-w-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-650 dark:text-blue-455 flex items-center justify-center font-bold text-lg border">
                            {rec.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{rec.name}</h4>
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                            {rec.industry || 'General IT/Software'}
                          </span>
                        </div>
                      </div>

                      {rec.website && (
                        <a 
                          href={rec.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {recruiters.length === 0 && (
                  <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-350 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white font-sans">No Recruiter Partners Found</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Start manually registering recruiters to populate your homepage partners banner!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-150/40 dark:border-gray-700/50 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white font-sans">Manual Recruiter Partner Entry</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fill out details to manually list a corporate recruiter partner.
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Google India"
                        value={recruiterForm.name}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Industry Domain
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IT/Software, Automobile"
                        value={recruiterForm.industry}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, industry: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Corporate Website URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://google.com"
                        value={recruiterForm.website}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Corporate Logo Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://logo.clearbit.com/google.com"
                        value={recruiterForm.logoUrl}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, logoUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Office Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. hr@google.com"
                        value={recruiterForm.email}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9999999999"
                        value={recruiterForm.phone}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Brief Description / Notes
                      </label>
                      <textarea
                        placeholder="Brief overview of recruitment details..."
                        value={recruiterForm.description}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white focus:outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 text-sm"
                    >
                      {isUploading ? 'Registering...' : 'Register Partner Recruiter'}
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
                    Select Recruiter spreadsheet file
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
                          Parsed Recruiter Partners Preview
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Check validated recruiters before committing them dynamically.
                        </p>
                      </div>
                      <button
                        onClick={commitBulkRecruitersData}
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Recruiter Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Industry Domain</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Corporate Website</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Verify Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {previewData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-white">
                                {record.name}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                {record.industry || 'General IT/Software'}
                              </td>
                              <td className="px-6 py-4 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                {record.website || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                {record.isValid ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200">
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200" title="Company Name is required.">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4 font-sans text-sm">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Recruiter Partners Display Rules
              </h4>
              <ul className="space-y-2 text-blue-850 dark:text-blue-200 list-disc list-inside">
                <li>Manually registered brand profiles will **only showcase** inside the sliding recruiter marquee on the public Homepage.</li>
                <li>They will be automatically filtered out from corporate recruiter log-in approvals and placement drives, keeping your business registries perfectly clean.</li>
                <li>Since this uses `/companies` under the hood to bypass database write restrictions, an hr email `recruiter@company.com` is auto-filled for schema validation if not provided.</li>
              </ul>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageRecruiters;
