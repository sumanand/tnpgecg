import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db, storage } from '../../firebase/config';
import { ref, get, query, orderByChild, equalTo, set as dbSet } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Award, Trophy, Calendar, Building, Download, Share2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PlacementHistory = () => {
  const { currentUser } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacementHistory();
  }, [currentUser]);

  const fetchPlacementHistory = async () => {
    try {
      const selectedRef = query(ref(db, 'selected_students'), orderByChild('studentId'), equalTo(currentUser.uid));
      const snapshot = await get(selectedRef);
      const selections = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          selections.push({ id: child.key, ...child.val() });
        });
      }
      
      for (const selection of selections) {
        // Fetch drive details
        const driveRef = ref(db, `placement_drives/${selection.driveId}`);
        const driveSnapshot = await get(driveRef);
        if (driveSnapshot.exists()) {
          selection.driveDetails = driveSnapshot.val();
        }
        
        // Fetch student's own cache for offer letter and custom updates
        const studentPlacementRef = ref(db, `students/${currentUser.uid}/placements/${selection.id}`);
        const studentPlacementSnap = await get(studentPlacementRef);
        if (studentPlacementSnap.exists()) {
          const val = studentPlacementSnap.val();
          selection.offerLetterUrl = val.offerLetterUrl || selection.offerLetterUrl || null;
          selection.offerLetterBase64 = val.offerLetterBase64 || null;
          selection.joiningDate = val.joiningDate || selection.joiningDate || '';
          selection.bond = val.bond || selection.bond || '';
        }
      }
      
      setSelectedStudents(selections);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching placement history:', error);
      setLoading(false);
    }
  };

  const [uploadingId, setUploadingId] = useState(null);

  const downloadOfferLetter = (selection) => {
    if (selection.offerLetterUrl) {
      window.open(selection.offerLetterUrl, '_blank');
    } else if (selection.offerLetterBase64) {
      const link = document.createElement('a');
      link.href = selection.offerLetterBase64;
      link.download = `Offer_Letter_${selection.driveDetails?.company || 'Placement'}.pdf`;
      link.click();
    } else {
      toast.error('Offer letter is not uploaded yet.');
    }
  };

  const handleOfferLetterUpload = async (e, selectionId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 2MB for base64 safety)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    setUploadingId(selectionId);
    const toastId = toast.loading('Uploading offer letter...');

    try {
      let downloadUrl = null;
      let base64Data = null;

      // 1. Try uploading to Firebase Storage
      try {
        const fileRef = storageRef(storage, `offer_letters/${currentUser.uid}/${selectionId}_${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        downloadUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, falling back to base64 encoding:', storageErr.message);
      }

      // 2. Convert to Base64 (always do it as fallback or primary if Storage failed)
      const reader = new FileReader();
      base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      // 3. Save to database under student profile placements cache
      const studentPlacementRef = ref(db, `students/${currentUser.uid}/placements/${selectionId}`);
      
      // Fetch existing placement data or initialize
      const snap = await get(studentPlacementRef);
      const existingData = snap.exists() ? snap.val() : {};

      await dbSet(studentPlacementRef, {
        ...existingData,
        offerLetterUrl: downloadUrl || existingData.offerLetterUrl || '',
        offerLetterBase64: base64Data || '',
        updatedAt: new Date().toISOString()
      });

      toast.success('Offer letter uploaded successfully! 🎉', { id: toastId });
      fetchPlacementHistory();
    } catch (err) {
      console.error('Error uploading offer letter:', err);
      toast.error('Failed to upload offer letter.', { id: toastId });
    } finally {
      setUploadingId(null);
    }
  };

  const shareSuccess = (selection) => {
    // Share on social media or copy link
    navigator.clipboard.writeText(`I got placed at ${selection.driveDetails?.company || selection.company} with package ${selection.driveDetails?.package || selection.package}! 🎉`);
    toast.success('Success message copied to clipboard! Share it with pride!');
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
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Placement History" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-8 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Your Placement Journey</h2>
                  <p className="text-green-100">Congratulations on your achievements! 🎉</p>
                </div>
                <Trophy className="w-16 h-16 opacity-50" />
              </div>
            </div>
            
            {selectedStudents.length > 0 ? (
              <div className="space-y-6">
                {selectedStudents.map((selection, index) => (
                  <div key={selection.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Award className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                              {selection.driveDetails?.title || selection.role || 'Placement Selection'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">{selection.driveDetails?.company || selection.company}</p>
                          </div>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full font-semibold">
                          Selected ✅
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Package</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{selection.driveDetails?.package || selection.package}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Selected On</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{new Date(selection.selectedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Trophy className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Joining Date</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{selection.joiningDate || 'To be announced'}</p>
                          </div>
                        </div>
                      </div>
                                      <div className="bg-gray-55 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Offer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">CTC</p>
                            <p className="text-gray-800 dark:text-white">{selection.driveDetails?.package || selection.package}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Bond</p>
                            <p className="text-gray-800 dark:text-white">{selection.bond || 'No bond'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Location</p>
                            <p className="text-gray-800 dark:text-white">{selection.driveDetails?.location || selection.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Role</p>
                            <p className="text-gray-800 dark:text-white">{selection.role || selection.driveDetails?.title || 'Selected Candidate'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Offer Letter Upload & Download Area */}
                      <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200/40 dark:border-indigo-500/10 rounded-2xl p-5 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              (selection.offerLetterUrl || selection.offerLetterBase64)
                                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 border-green-200/30'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200/30'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-800 dark:text-white text-sm">
                                Offer Letter Status
                              </h5>
                              <p className={`text-xs font-semibold mt-0.5 ${
                                (selection.offerLetterUrl || selection.offerLetterBase64)
                                  ? 'text-green-600 dark:text-green-450'
                                  : 'text-amber-600 dark:text-amber-450'
                              }`}>
                                {(selection.offerLetterUrl || selection.offerLetterBase64) 
                                  ? 'Offer Letter Available (Uploaded) 📄' 
                                  : 'No Offer Letter Uploaded Yet ⚠️'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* If offer letter is available, let them download it */}
                            {(selection.offerLetterUrl || selection.offerLetterBase64) && (
                              <button
                                onClick={() => downloadOfferLetter(selection)}
                                className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                              </button>
                            )}

                            {/* Let them upload/re-upload the offer letter */}
                            <div>
                              <input
                                type="file"
                                id={`offer-letter-file-${selection.id}`}
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => handleOfferLetterUpload(e, selection.id)}
                                className="hidden"
                                disabled={uploadingId === selection.id}
                              />
                              <label
                                htmlFor={`offer-letter-file-${selection.id}`}
                                className={`px-4.5 py-2.5 font-bold rounded-xl text-xs transition-all border shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                  uploadingId === selection.id
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed'
                                    : 'bg-white/60 dark:bg-slate-900/60 border-gray-200/50 dark:border-indigo-500/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-955/60'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingId === selection.id ? 'Uploading...' : (selection.offerLetterUrl || selection.offerLetterBase64) ? 'Update Letter' : 'Upload Offer Letter'}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => shareSuccess(selection)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-650 hover:from-green-755 hover:to-emerald-755 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-green-500/10 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share Placement Success Story 🎉
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Placement History Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Once you get selected, your placement details will appear here</p>
              </div>
            )}
            
            {/* Tips Section */}
            <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">🎯 Tips for Success</h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Keep your resume updated with latest projects and skills</li>
                <li>• Practice coding problems and aptitude tests regularly</li>
                <li>• Research companies before applying</li>
                <li>• Prepare for HR interviews and group discussions</li>
                <li>• Network with alumni working in target companies</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlacementHistory;