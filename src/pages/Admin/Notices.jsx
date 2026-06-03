import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { db, storage } from '../../firebase/config';
import { ref, push, set, get, remove, update, query, orderByChild, limitToLast } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parseGoogleDriveLink } from '../../utils/driveUtils';
import { toast } from 'react-hot-toast';
import { Bell, Send, Trash2, Edit2, Users, Calendar, AlertCircle, Megaphone, Image as ImageIcon, Upload, Link as LinkIcon, Save, Eye } from 'lucide-react';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    target: 'all'
  });
  const [sending, setSending] = useState(false);

  // Carousel Slide State Management variables
  const [activeTab, setActiveTab] = useState('notices'); // 'notices' or 'slides'
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideFormData, setSlideFormData] = useState({
    title: '',
    subtitle: '',
    tag: '',
    imageSource: 'url', // 'url' or 'upload'
    imageUrl: '',
    imageFile: null
  });
  const [savingSlide, setSavingSlide] = useState(false);

  useEffect(() => {
    fetchNotices();
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoadingSlides(true);
    try {
      const slidesRef = ref(db, 'carousel_slides');
      const snapshot = await get(slidesRef);
      const slidesList = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          slidesList.push({ id: child.key, ...child.val() });
        });
      }
      setSlides(slidesList);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoadingSlides(false);
    }
  };

  const handleSlideSubmit = async (e) => {
    e.preventDefault();
    setSavingSlide(true);

    try {
      let finalImageUrl = slideFormData.imageUrl;

      // Handle local file upload
      if (slideFormData.imageSource === 'upload' && slideFormData.imageFile) {
        const fileRef = storageRef(storage, `carousel_images/${Date.now()}_${slideFormData.imageFile.name}`);
        await uploadBytes(fileRef, slideFormData.imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
      } else {
        // Parse direct link (including Google Drive links)
        finalImageUrl = parseGoogleDriveLink(finalImageUrl);
      }

      if (!finalImageUrl) {
        toast.error('Please upload an image or provide an image link');
        setSavingSlide(false);
        return;
      }

      const slideData = {
        title: slideFormData.title,
        subtitle: slideFormData.subtitle,
        tag: slideFormData.tag,
        image: finalImageUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingSlide) {
        await update(ref(db, `carousel_slides/${editingSlide.id}`), slideData);
        toast.success('Slide updated successfully');
      } else {
        slideData.createdAt = new Date().toISOString();
        const newSlideRef = push(ref(db, 'carousel_slides'));
        await set(newSlideRef, slideData);
        toast.success('New slide added successfully');
      }

      setShowSlideForm(false);
      setEditingSlide(null);
      setSlideFormData({
        title: '',
        subtitle: '',
        tag: '',
        imageSource: 'url',
        imageUrl: '',
        imageFile: null
      });
      fetchSlides();
    } catch (error) {
      toast.error('Error saving slide: ' + error.message);
    } finally {
      setSavingSlide(false);
    }
  };

  const handleSlideDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await remove(ref(db, `carousel_slides/${id}`));
        toast.success('Slide deleted successfully');
        fetchSlides();
      } catch (error) {
        toast.error('Error deleting slide');
      }
    }
  };

  const fetchNotices = async () => {
    try {
      const noticesRef = query(ref(db, 'notifications'), orderByChild('createdAt'), limitToLast(50));
      const snapshot = await get(noticesRef);
      const noticesList = [];
      snapshot.forEach((child) => {
        noticesList.push({ id: child.key, ...child.val() });
      });
      noticesList.reverse();
      setNotices(noticesList);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching notices');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      if (editingNotice) {
        await update(ref(db, `notifications/${editingNotice.id}`), {
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          updatedAt: new Date().toISOString()
        });
        toast.success('Notice updated successfully');
      } else {
        let studentsList = [];
        
        if (formData.target === 'all') {
          // Fetch all students
          const studentsRef = ref(db, 'students');
          const studentsSnap = await get(studentsRef);
          studentsSnap.forEach((child) => {
            studentsList.push(child.key);
          });
        } else if (formData.target === 'branch') {
          // Fetch students by branch (you can add branch filter logic)
          const studentsRef = ref(db, 'students');
          const studentsSnap = await get(studentsRef);
          studentsSnap.forEach((child) => {
            if (child.val().branch === formData.branch) {
              studentsList.push(child.key);
            }
          });
        }

        // Create broadcast notification
        const noticeRef = push(ref(db, 'notifications'));
        await set(noticeRef, {
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          type: 'broadcast',
          target: formData.target,
          targetBranch: formData.target === 'branch' ? formData.branch : null,
          createdAt: new Date().toISOString(),
          read: false
        });

        toast.success(`Notice sent to ${studentsList.length || 'all'} students`);
      }

      setShowForm(false);
      setEditingNotice(null);
      setFormData({
        title: '',
        message: '',
        priority: 'normal',
        target: 'all'
      });
      fetchNotices();
    } catch (error) {
      toast.error('Error sending notice');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await remove(ref(db, `notifications/${id}`));
        toast.success('Notice deleted successfully');
        fetchNotices();
      } catch (error) {
        toast.error('Error deleting notice');
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.normal;
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
        <Header title="Notices & Announcements" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Dynamic Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {activeTab === 'notices' ? 'Notice Board & Announcements' : 'Homepage Hero Image Slides'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  {activeTab === 'notices' 
                    ? 'Post, edit, and broadcast real-time announcements for all students' 
                    : 'Manage custom widescreen images, captions, and tags showcased on the home slider'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'notices') {
                    setEditingNotice(null);
                    setFormData({
                      title: '',
                      message: '',
                      priority: 'normal',
                      target: 'all'
                    });
                    setShowForm(true);
                  } else {
                    setEditingSlide(null);
                    setSlideFormData({
                      title: '',
                      subtitle: '',
                      tag: '',
                      imageSource: 'url',
                      imageUrl: '',
                      imageFile: null
                    });
                    setShowSlideForm(true);
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm text-sm font-semibold whitespace-nowrap self-start sm:self-auto"
              >
                {activeTab === 'notices' ? (
                  <>
                    <Megaphone className="w-4 h-4 mr-2 shrink-0" />
                    Post Notice
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2 shrink-0" />
                    Add Slide
                  </>
                )}
              </button>
            </div>

            {/* Premium Frosted Tab Switcher */}
            <div className="flex border-b border-gray-250 dark:border-slate-800 mb-6">
              <button
                onClick={() => setActiveTab('notices')}
                className={`px-5 py-3 font-semibold text-xs sm:text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'notices'
                    ? 'border-blue-600 text-blue-600 dark:border-indigo-500 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                Announcements Feed
              </button>
              <button
                onClick={() => setActiveTab('slides')}
                className={`px-5 py-3 font-semibold text-xs sm:text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'slides'
                    ? 'border-blue-600 text-blue-600 dark:border-indigo-500 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                <ImageIcon className="w-4.5 h-4.5" />
                Hero Slideshow Carousel
              </button>
            </div>

            {/* TAB 1: NOTICES & ANNOUNCEMENTS */}
            {activeTab === 'notices' && (
              <>
                {/* Notice Form Modal */}
                {showForm && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-150/20 dark:border-slate-800">
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Megaphone className="w-5.5 h-5.5 text-blue-600 dark:text-indigo-400" />
                          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                            {editingNotice ? 'Edit Broadcast Announcement' : 'Publish Broadcast Notice'}
                          </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                              Notice Title *
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Provide a clear, brief headline..."
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                              Message Content *
                            </label>
                            <textarea
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              rows={4}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 leading-relaxed"
                              placeholder="Detail the complete text of the notice..."
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Urgency Priority
                              </label>
                              <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2.5 border rounded-xl border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm"
                              >
                                <option value="low">Low Priority</option>
                                <option value="normal">Normal Priority</option>
                                <option value="high">High Priority</option>
                                <option value="urgent">Urgent Alert</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Target Student Pool
                              </label>
                              <select
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-full px-4 py-2.5 border rounded-xl border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm"
                              >
                                <option value="all">All Registered Students</option>
                                <option value="branch">Specific Batch Branch</option>
                              </select>
                            </div>
                          </div>
                          
                          {formData.target === 'branch' && (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Select Target Branch
                              </label>
                              <select
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full px-4 py-2.5 border rounded-xl border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm"
                                required
                              >
                                <option value="">Select Branch</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Electrical">Electrical</option>
                              </select>
                            </div>
                          )}
                          
                          <div className="flex space-x-3 pt-4 border-t border-gray-150/40 dark:border-slate-800/40">
                            <button
                              type="submit"
                              disabled={sending}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center text-sm gap-1.5"
                            >
                              <Send className="w-4.5 h-4.5" />
                              {sending ? 'Publishing...' : editingNotice ? 'Update Notice' : 'Broadcast Notice'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowForm(false)}
                              className="flex-1 bg-gray-150 text-gray-705 py-2.5 rounded-xl hover:bg-gray-250 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-650 font-bold transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notices List */}
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150/40 dark:border-slate-850 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                      {/* Urgency indicator strip */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                        notice.priority === 'urgent' ? 'bg-red-500' :
                        notice.priority === 'high' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1.5">
                            <Bell className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{notice.title}</h3>
                            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getPriorityColor(notice.priority)}`}>
                              {notice.priority?.toUpperCase() || 'NORMAL'}
                            </span>
                          </div>
                          <p className="text-gray-650 dark:text-gray-305 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{notice.message}</p>
                          
                          <div className="flex items-center text-xs text-gray-450 dark:text-gray-500 gap-6 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(notice.createdAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3.5 h-3.5" />
                              Target: {notice.target === 'all' ? 'All Registered Students' : notice.targetBranch}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4 shrink-0">
                          <button
                            onClick={() => {
                              setEditingNotice(notice);
                              setFormData({
                                title: notice.title,
                                message: notice.message,
                                priority: notice.priority,
                                target: notice.target,
                                branch: notice.targetBranch || ''
                              });
                              setShowForm(true);
                            }}
                            className="p-2 rounded-xl text-blue-650 bg-blue-50 hover:bg-blue-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Edit notice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="p-2 rounded-xl text-red-650 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete notice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notices.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/40 dark:border-slate-800">
                      <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No notices posted yet</h3>
                      <p className="text-gray-500 dark:text-gray-450 mt-2 text-sm max-w-xs mx-auto">Publish your first announcement or placement bulletin to notify all students!</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: HOMEPAGE CAROUSEL SLIDESHOW */}
            {activeTab === 'slides' && (
              <div className="space-y-4 animate-fade-in">
                {/* Widescreen Slides List */}
                {loadingSlides ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/40 dark:border-slate-800/40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-3">Loading slideshow slides...</span>
                  </div>
                ) : slides.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/40 dark:border-slate-800/40 p-6">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No custom slides active</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-450 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      All homepage slides are currently rendering default college smart classrooms and Bihar Govt. PAHAL initiative pictures. Create your first custom slide to overwrite them!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {slides.map((slide) => (
                      <div key={slide.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/40 dark:border-slate-800/40 p-4 hover:shadow-sm transition-all flex flex-col md:flex-row items-center md:items-start gap-4">
                        {/* Widescreen Image Thumbnail Preview */}
                        <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0 bg-gray-50 dark:bg-slate-900 flex items-center justify-center relative group shadow-sm">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=675&q=80";
                            }}
                          />
                          <a 
                            href={slide.image} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Full
                          </a>
                        </div>

                        {/* Slide Content Area */}
                        <div className="flex-1 min-w-0 self-stretch flex flex-col justify-between text-center md:text-left py-1">
                          <div>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                              {slide.tag && (
                                <span className="bg-blue-50 text-blue-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-100/60 dark:border-indigo-900/30 uppercase tracking-wider">
                                  {slide.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug truncate">
                              {slide.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {slide.subtitle}
                            </p>
                          </div>

                          <div className="text-[10px] text-gray-450 dark:text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Updated: {new Date(slide.updatedAt || slide.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex md:flex-col gap-2 shrink-0 self-center">
                          <button
                            onClick={() => {
                              setEditingSlide(slide);
                              setSlideFormData({
                                title: slide.title,
                                subtitle: slide.subtitle,
                                tag: slide.tag,
                                imageSource: 'url',
                                imageUrl: slide.image,
                                imageFile: null
                              });
                              setShowSlideForm(true);
                            }}
                            className="px-3.5 py-2 rounded-xl text-blue-650 bg-blue-50 hover:bg-blue-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center text-xs font-semibold gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Slide
                          </button>
                          <button
                            onClick={() => handleSlideDelete(slide.id)}
                            className="px-3.5 py-2 rounded-xl text-red-650 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center text-xs font-semibold gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Slide Creation & Editing Dialog Overlay Modal */}
                {showSlideForm && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-150/20 dark:border-slate-800 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <ImageIcon className="w-5.5 h-5.5 text-blue-600 dark:text-indigo-400" />
                          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                            {editingSlide ? 'Edit Slide Details' : 'Publish New Slide'}
                          </h3>
                        </div>

                        <form onSubmit={handleSlideSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                              Slide Header / Title *
                            </label>
                            <input
                              type="text"
                              value={slideFormData.title}
                              onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. Dynamic Campus Placement Drive Success"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                              Subtitle Caption Text *
                            </label>
                            <textarea
                              value={slideFormData.subtitle}
                              onChange={(e) => setSlideFormData({ ...slideFormData, subtitle: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 leading-relaxed"
                              placeholder="Detail what this slide displays. This caption displays directly on top of the widescreen photo..."
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Category Tag / Badge *
                              </label>
                              <input
                                type="text"
                                value={slideFormData.tag}
                                onChange={(e) => setSlideFormData({ ...slideFormData, tag: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Placements 2026"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Photo Source Method
                              </label>
                              <select
                                value={slideFormData.imageSource}
                                onChange={(e) => setSlideFormData({ ...slideFormData, imageSource: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="url">Google Drive / Image Web Link</option>
                                <option value="upload">Upload Local File from Device</option>
                              </select>
                            </div>
                          </div>

                          {slideFormData.imageSource === 'url' ? (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Image URL / Google Drive Share Link *
                              </label>
                              <input
                                type="url"
                                value={slideFormData.imageUrl}
                                onChange={(e) => setSlideFormData({ ...slideFormData, imageUrl: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-650 bg-white dark:bg-gray-750 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Paster Unsplash link or drive.google.com share link..."
                                required={slideFormData.imageSource === 'url'}
                              />
                              <p className="text-[10px] text-indigo-650 dark:text-indigo-400 mt-1.5 font-medium leading-relaxed">
                                💡 Tip: You can paste standard shareable links from Google Drive directly! The application automatically converts them for image rendering.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                                Select slide image *
                              </label>
                              <div className="relative border-2 border-dashed border-gray-250 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-1.5">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:scale-110 transition-transform duration-250" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setSlideFormData({ ...slideFormData, imageFile: e.target.files[0] })}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  required={slideFormData.imageSource === 'upload' && !editingSlide}
                                />
                                <span className="text-xs font-bold text-gray-750 dark:text-gray-200 truncate max-w-full">
                                  {slideFormData.imageFile ? slideFormData.imageFile.name : 'Click to select widescreen photo...'}
                                </span>
                                <span className="text-[10px] text-gray-400">Supported types: PNG, JPEG, JPG, WEBP, GIF</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex space-x-3 pt-4 border-t border-gray-150/40 dark:border-slate-800/40">
                            <button
                              type="submit"
                              disabled={savingSlide}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center text-sm gap-1.5"
                            >
                              <Save className="w-4.5 h-4.5" />
                              {savingSlide ? 'Saving Slide...' : editingSlide ? 'Update Slide' : 'Publish Slide'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSlideForm(false);
                                setEditingSlide(null);
                              }}
                              className="flex-1 bg-gray-150 text-gray-700 py-2.5 rounded-xl hover:bg-gray-250 dark:bg-gray-700 dark:text-gray-250 dark:hover:bg-gray-650 font-bold transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notices;