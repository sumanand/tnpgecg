import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { 
  Briefcase, 
  GraduationCap, 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Sun, 
  Moon, 
  ExternalLink, 
  Lock, 
  User, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Globe,
  AlertCircle,
  XCircle,
  Facebook,
  Linkedin,
  Youtube,
  Bell,
  Calendar,
  Megaphone,
  Search
} from 'lucide-react';
import { parseGoogleDriveLink } from '../utils/driveUtils';

const RecruiterLogo = ({ logoUrl, name, initials }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!logoUrl) {
    return (
      <div className="w-full h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base mb-2 group-hover:scale-110 transition-all duration-300">
        {initials || 'RP'}
      </div>
    );
  }

  return (
    <div className="relative w-full h-12 mb-2 flex items-center justify-center shrink-0 overflow-hidden">
      {(!loaded || error) && (
        <div className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs animate-pulse">
          {initials || 'RP'}
        </div>
      )}
      <img
        src={logoUrl}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-12 max-h-12 object-contain max-w-full filter dark:brightness-95 group-hover:scale-110 transition-all duration-300 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
        }`}
      />
    </div>
  );
};

const fallbackSlides = [
  {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=675&q=80",
    title: "State-of-the-Art College Campus",
    subtitle: "Government Engineering College (GEC), Gopalganj is one of Bihar's premier state-funded technical institutions. Our smart classrooms, digital library, and modern academic blocks foster academic excellence.",
    tag: "Academic Excellence"
  },
  {
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&h=675&q=80",
    title: "Empowering Students: Free Classes under the PAHAL Scheme",
    subtitle: "Free classes (Maths, Science, and English) of Class 9th-12th standard started in GEC Gopalganj Campus under the unique PAHAL Initiative by the Dept. of Science Technology & Technical Education, Govt. of Bihar.",
    tag: "Bihar Govt. Initiative"
  },
  {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&h=675&q=80",
    title: "Training & Placement Cell: Launching Careers",
    subtitle: "Connecting bright engineering graduates with international MNCs, coordinating mock interviews, aptitude bootcamps, and hosting on-campus/off-campus recruitment drives from leading companies.",
    tag: "Placements 2026"
  },
  {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&h=675&q=80",
    title: "Advanced Engineering Laboratories",
    subtitle: "Equipped with state-of-the-art instruments in Computer Science, Mechanical, Civil, and Electrical Labs, allowing engineering candidates to gain practical skills on industrial grade apparatus.",
    tag: "Modern Labs"
  }
];

const Home = () => {
  const { currentUser } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [drives, setDrives] = useState([]);
  const [placedStudents, setPlacedStudents] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState(null);
  const [stats, setStats] = useState({
    placementRate: '85%+',
    highestPackage: '12.4 LPA',
    recruiterCount: '50+',
    activeInternships: '30+'
  });
  
  const [notices, setNotices] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeNoticeDetail, setActiveNoticeDetail] = useState(null);
  const [showNoticesModal, setShowNoticesModal] = useState(false);
  const [noticeSearchTerm, setNoticeSearchTerm] = useState('');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('all');
  
  const sampleNotices = [
    {
      id: 'notice-sample-1',
      title: 'TCS NQT 2026 Registration Open',
      message: 'TCS is hiring Ninja and Digital roles for the 2026 batch. Register on the TCS NextStep portal before June 15, 2026. Mock tests will be conducted next week by the T&P Cell faculty coordinators.',
      priority: 'high',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'notice-sample-2',
      title: 'Workshop on Resume Building & AI Portfolios',
      message: 'A mandatory hands-on workshop on crafting high-impact resumes and professional GitHub/LinkedIn profiles will be held on June 5, 2026. Guest speaker: Senior Talent Acquisition Manager from Tech Mahindra.',
      priority: 'normal',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'notice-sample-3',
      title: 'Cognizant Off-Campus Drive Guidelines',
      message: 'All students applied for the Programmer Analyst role are instructed to complete their profile verification on the Cognizant hiring portal. Make sure your CGPA is accurate to avoid rejection.',
      priority: 'urgent',
      createdAt: new Date().toISOString()
    }
  ];

  const getNoticePriorityBadge = (priority) => {
    const configs = {
      urgent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
      high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900',
      normal: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
      low: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700'
    };
    return configs[priority] || configs.normal;
  };
  
  // Hardcoded fallback drives if database is empty
  const sampleDrives = [
    {
      id: 'sample-1',
      company: 'Tech Mahindra',
      title: 'Software Engineer Trainee',
      package: '5.5 LPA',
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      driveType: 'placement',
      eligibility: 'B.Tech CSE/ECE, Min 6.5 CGPA'
    },
    {
      id: 'sample-2',
      company: 'Cognizant',
      title: 'Programmer Analyst',
      package: '4.5 LPA',
      deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
      driveType: 'placement',
      eligibility: 'B.Tech All Branches, Min 6.0 CGPA'
    },
    {
      id: 'sample-3',
      company: 'Wipro',
      title: 'Project Engineer',
      package: '6.5 LPA',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      driveType: 'placement',
      eligibility: 'B.Tech CSE/ECE/EE, Min 7.0 CGPA'
    },
    {
      id: 'sample-4',
      company: 'Tata Motors',
      title: 'Graduate Engineer Trainee',
      package: '6.2 LPA',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      driveType: 'placement',
      eligibility: 'B.Tech ME/EE, Min 6.5 CGPA'
    },
    {
      id: 'sample-5',
      company: 'TCS',
      title: 'Research & Development Intern',
      package: '30,000 / month',
      deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
      driveType: 'internship',
      eligibility: 'B.Tech CSE/ECE (3rd Year), Min 7.5 CGPA'
    },
    {
      id: 'sample-6',
      company: 'Intel',
      title: 'Hardware Intern',
      package: '45,000 / month',
      deadline: new Date(Date.now() + 86400000 * 8).toISOString(),
      driveType: 'internship',
      eligibility: 'B.Tech ECE/EE (3rd Year), Min 8.0 CGPA'
    }
  ];

  const formatDeadline = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  const formatNoticeDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatEligibility = (eligibility) => {
    if (!eligibility) return 'Check Details';
    if (typeof eligibility === 'string') return eligibility;
    if (typeof eligibility === 'object') {
      const parts = [];
      if (eligibility.minCGPA) parts.push(`CGPA: ${eligibility.minCGPA}+`);
      if (eligibility.branches) {
        if (Array.isArray(eligibility.branches)) {
          parts.push(eligibility.branches.join(', '));
        } else {
          parts.push(String(eligibility.branches));
        }
      }
      return parts.length > 0 ? parts.join(' | ') : 'Check Details';
    }
    return String(eligibility);
  };

  const getRandomBgColor = (key) => {
    const colors = [
      "from-blue-500 to-indigo-600 shadow-blue-500/10",
      "from-purple-500 to-pink-600 shadow-purple-500/10",
      "from-teal-500 to-emerald-600 shadow-teal-500/10",
      "from-amber-500 to-orange-600 shadow-amber-500/10",
      "from-cyan-500 to-blue-600 shadow-cyan-500/10",
      "from-red-500 to-rose-600 shadow-red-500/10"
    ];
    let hash = 0;
    if (key) {
      for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getAvatarInitials = (name) => {
    if (!name) return 'AS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Helper: Parse package string to numeric values to allow perfect mathematical sorting
  const parsePackageValue = (pkgStr) => {
    if (!pkgStr) return 0;
    const str = String(pkgStr).toLowerCase();
    const numMatch = str.match(/[\d.]+/);
    if (!numMatch) return 0;
    const num = parseFloat(numMatch[0]);
    
    if (str.includes('lpa')) {
      return num * 100000;
    }
    if (str.includes('month') || str.includes('pm')) {
      return num * 12;
    }
    if (str.includes('k')) {
      return num * 1000 * 12;
    }
    return num;
  };

  useEffect(() => {
    const fetchDrivesAndPlacements = async () => {
      let placementsSnap = null;
      let internshipsSnap = null;
      let snapshot = null;
      let companiesSnap = null;

      // 1. Fetch drives
      try {
        const placementsRef = ref(db, 'placement_drives');
        const internshipsRef = ref(db, 'internship_drives');
        
        const [pSnap, iSnap] = await Promise.all([
          get(placementsRef),
          get(internshipsRef)
        ]);
        placementsSnap = pSnap;
        internshipsSnap = iSnap;
        
        const fetchedDrives = [];
        
        if (placementsSnap.exists()) {
          placementsSnap.forEach((child) => {
            fetchedDrives.push({ id: child.key, driveType: 'placement', ...child.val() });
          });
        }
        
        if (internshipsSnap.exists()) {
          internshipsSnap.forEach((child) => {
            fetchedDrives.push({ id: child.key, driveType: 'internship', ...child.val() });
          });
        }
        
        if (fetchedDrives.length > 0) {
          fetchedDrives.sort((a, b) => {
            const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return dateA - dateB;
          });
          setDrives(fetchedDrives.slice(0, 6));
        } else {
          setDrives(sampleDrives);
        }
      } catch (error) {
        console.error("Error fetching drives:", error);
        setDrives(sampleDrives);
      }

      // 2. Fetch placed students
      try {
        const selectedRef = ref(db, 'selected_students');
        snapshot = await get(selectedRef);
        const list = [];
        
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const val = child.val();
            list.push({
              id: child.key,
              name: val.studentName || 'Anonymous Student',
              branch: val.branch || 'General Engineering',
              year: val.passingYear ? `Class of ${val.passingYear}` : 'Class of 2025',
              company: val.company || 'Unknown Company',
              package: val.package || 'N/A',
              type: val.driveType === 'internship' ? 'Internship' : 'Placement',
              bgColor: getRandomBgColor(child.key),
              avatar: getAvatarInitials(val.studentName || 'AS'),
              packageVal: parsePackageValue(val.package)
            });
          });
        }
        
        if (list.length > 0) {
          // Sort by package descending (highest package first)
          list.sort((a, b) => b.packageVal - a.packageVal);
          setPlacedStudents(list.slice(0, 6)); // Show top 6 "good" placements on homepage
        } else {
          setPlacedStudents(fallbackPlacedStudents);
        }
      } catch (error) {
        console.error("Error fetching placed students:", error);
        setPlacedStudents(fallbackPlacedStudents);
      }

      // 3. Fetch recruiter partners list from /companies
      try {
        const companiesRef = ref(db, 'companies');
        companiesSnap = await get(companiesRef);
        const rList = [];
        if (companiesSnap.exists()) {
          companiesSnap.forEach((c) => {
            const val = c.val();
            if (val.isRecruiter === true) {
              rList.push({ id: c.key, ...val });
            }
          });
        }
        setRecruiters(rList);
      } catch (err) {
        console.error("Error fetching recruiters:", err);
      }

      // 4. Calculate Placement Statistics Dynamically
      try {
        let totalStudents = 0;
        try {
          const studentsSnap = await get(ref(db, 'students'));
          if (studentsSnap.exists()) {
            studentsSnap.forEach(() => { totalStudents++; });
          }
        } catch (e) {
          console.warn("Failed to fetch students count:", e.message);
        }

        const placedStudentIds = new Set();
        let maxPackageVal = 0;
        let maxPackageStr = '';

        if (snapshot && snapshot.exists()) {
          snapshot.forEach((child) => {
            const val = child.val();
            if (val.driveType !== 'internship' && val.studentId) {
              placedStudentIds.add(val.studentId);
            }
            if (val.package) {
              const pVal = parsePackageValue(val.package);
              if (pVal > maxPackageVal) {
                maxPackageVal = pVal;
                maxPackageStr = val.package;
              }
            }
          });
        }

        let recruiterCount = 0;
        if (companiesSnap && companiesSnap.exists()) {
          companiesSnap.forEach((child) => {
            const val = child.val();
            if (val.status === 'approved' || val.isRecruiter === true) {
              recruiterCount++;
            }
          });
        }

        let activeInternships = 0;
        if (internshipsSnap && internshipsSnap.exists()) {
          internshipsSnap.forEach(() => { activeInternships++; });
        }

        let placementRateStr = '85%+';
        if (totalStudents > 0) {
          const rate = Math.min(100, Math.round((placedStudentIds.size / totalStudents) * 100));
          placementRateStr = `${rate > 0 ? rate : 85}%+`;
        }

        setStats({
          placementRate: placementRateStr,
          highestPackage: maxPackageVal > 0 ? maxPackageStr : '12.4 LPA',
          recruiterCount: recruiterCount > 0 ? `${recruiterCount}+` : '50+',
          activeInternships: activeInternships > 0 ? `${activeInternships}+` : '30+'
        });
      } catch (statsErr) {
        console.error("Error calculating dynamic stats:", statsErr);
      }

      // 5. Fetch notices from notifications node and merge with drives
      try {
        const notificationsRef = ref(db, 'notifications');
        const notificationsSnap = await get(notificationsRef);
        const noticesList = [];
        const seenTitlesAndCompanies = new Set();
        
        // A. Load broadcast notices first
        if (notificationsSnap.exists()) {
          notificationsSnap.forEach((child) => {
            const val = child.val();
            // Fetch everything under /notifications to satisfy "jo bhi data notifications node mein hai usko show karwao"
            noticesList.push({ 
              id: child.key, 
              title: val.title || 'Official Announcement',
              message: val.message || '',
              priority: val.priority || 'normal',
              createdAt: val.createdAt || new Date().toISOString(),
              target: val.target || 'all',
              targetBranch: val.targetBranch || null,
              type: val.type || 'broadcast',
              isNotification: true
            });
            
            // Mark signature as seen to prevent duplicates
            const titleStr = String(val.title || '').toLowerCase();
            const msgStr = String(val.message || '').toLowerCase();
            const sig = `${titleStr}_${msgStr}`;
            seenTitlesAndCompanies.add(sig);
          });
        }

        // B. Parse active drives (placements and internships) to merge if not already covered
        const allDrives = [];
        if (placementsSnap && placementsSnap.exists()) {
          placementsSnap.forEach((child) => {
            allDrives.push({ id: child.key, driveType: 'placement', ...child.val() });
          });
        }
        
        if (internshipsSnap && internshipsSnap.exists()) {
          internshipsSnap.forEach((child) => {
            allDrives.push({ id: child.key, driveType: 'internship', ...child.val() });
          });
        }

        // C. Merge drives dynamically
        allDrives.forEach((drive) => {
          const companyName = drive.company || 'Unknown Company';
          const jobTitle = drive.title || 'Role';
          const driveTitle = `New ${drive.driveType === 'placement' ? 'Placement' : 'Internship'} Opportunity`;
          const driveMessage = `${companyName} is hiring for ${jobTitle}. Apply before ${formatDeadline(drive.deadline)}`;
          const sig = `${driveTitle.toLowerCase()}_${driveMessage.toLowerCase()}`;
          
          if (!seenTitlesAndCompanies.has(sig)) {
            // Check if there is already a notice mentioning this company and title to prevent double listing
            let alreadyNotified = false;
            for (const n of noticesList) {
              const msg = (n.message || '').toLowerCase();
              if (msg.includes(companyName.toLowerCase()) && msg.includes(jobTitle.toLowerCase())) {
                alreadyNotified = true;
                break;
              }
            }
            
            if (!alreadyNotified) {
              noticesList.push({
                id: `raw-drive-${drive.id}`,
                title: `${drive.driveType === 'placement' ? 'Job Opening' : 'Internship Opportunity'}: ${companyName}`,
                message: `${companyName} has announced an active drive for "${jobTitle}". Offered Package/Stipend: ${drive.package || 'N/A'}. Eligibility criteria: ${formatEligibility(drive.eligibility)}. Application Deadline: ${formatDeadline(drive.deadline)}.`,
                priority: 'high',
                createdAt: drive.createdAt || drive.deadline || new Date().toISOString(),
                target: 'all',
                targetBranch: drive.eligibility?.branches ? (Array.isArray(drive.eligibility.branches) ? drive.eligibility.branches.join(', ') : String(drive.eligibility.branches)) : null,
                isRawDrive: true,
                driveType: drive.driveType
              });
            }
          }
        });
        
        if (noticesList.length > 0) {
          // Sort by createdAt descending (newest first)
          noticesList.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setNotices(noticesList);
        } else {
          setNotices(sampleNotices);
        }
      } catch (error) {
        console.error("Error fetching notices:", error);
        setNotices(sampleNotices);
      }

      // 6. Fetch Carousel Slides from Realtime Database
      try {
        const slidesRef = ref(db, 'carousel_slides');
        const slidesSnap = await get(slidesRef);
        const fetchedSlides = [];
        if (slidesSnap.exists()) {
          slidesSnap.forEach((child) => {
            const val = child.val();
            fetchedSlides.push({
              id: child.key,
              image: parseGoogleDriveLink(val.image),
              title: val.title || '',
              subtitle: val.subtitle || '',
              tag: val.tag || ''
            });
          });
        }
        
        if (fetchedSlides.length > 0) {
          setCarouselSlides(fetchedSlides);
        } else {
          setCarouselSlides(fallbackSlides);
        }
      } catch (slidesErr) {
        console.error("Error fetching carousel slides:", slidesErr);
        setCarouselSlides(fallbackSlides);
      }
    };
    
    fetchDrivesAndPlacements();
  }, []);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselSlides]);

  const handleApplyClick = (type) => {
    if (currentUser) {
      if (type === 'placement') {
        navigate('/student/placements');
      } else {
        navigate('/student/internships');
      }
    } else {
      setSelectedDriveType(type);
      setShowAuthModal(true);
    }
  };

  // Curated Fallback placed students data
  const fallbackPlacedStudents = [
    {
      name: "Aman Kumar",
      branch: "Computer Science & Engineering",
      year: "Class of 2025",
      company: "Tech Mahindra",
      package: "12.4 LPA",
      type: "Placement",
      bgColor: "from-blue-500 to-indigo-600 shadow-blue-500/10",
      avatar: "AK"
    },
    {
      name: "Riya Kumari",
      branch: "Electronics & Communication",
      year: "Class of 2025",
      company: "TCS Digital",
      package: "7.5 LPA",
      type: "Placement",
      bgColor: "from-purple-500 to-pink-600 shadow-purple-500/10",
      avatar: "RK"
    },
    {
      name: "Sonu Singh",
      branch: "Electrical Engineering",
      year: "Class of 2025",
      company: "PowerGrid",
      package: "9.8 LPA",
      type: "Placement",
      bgColor: "from-teal-500 to-emerald-600 shadow-teal-500/10",
      avatar: "SS"
    },
    {
      name: "Anjali Priya",
      branch: "Computer Science & Engineering",
      year: "Class of 2026",
      company: "Cognizant",
      package: "₹ 35,000 / month",
      type: "Internship",
      bgColor: "from-amber-500 to-orange-600 shadow-amber-500/10",
      avatar: "AP"
    },
    {
      name: "Aditya Raj",
      branch: "Mechanical Engineering",
      year: "Class of 2025",
      company: "Tata Motors",
      package: "6.5 LPA",
      type: "Placement",
      bgColor: "from-cyan-500 to-blue-600 shadow-cyan-500/10",
      avatar: "AR"
    },
    {
      name: "Karan Johar",
      branch: "Civil Engineering",
      year: "Class of 2025",
      company: "L&T Construction",
      package: "6.0 LPA",
      type: "Placement",
      bgColor: "from-red-500 to-rose-600 shadow-red-500/10",
      avatar: "KJ"
    }
  ];
  const fallbackRecruiters = [
    { name: 'Tech Mahindra', logoUrl: 'https://logo.clearbit.com/techmahindra.com', industry: 'IT Services' },
    { name: 'TCS', logoUrl: 'https://logo.clearbit.com/tcs.com', industry: 'IT Consulting' },
    { name: 'Cognizant', logoUrl: 'https://logo.clearbit.com/cognizant.com', industry: 'IT/Software' },
    { name: 'Wipro', logoUrl: 'https://logo.clearbit.com/wipro.com', industry: 'Digital Solutions' },
    { name: 'Tata Motors', logoUrl: 'https://logo.clearbit.com/tatamotors.com', industry: 'Automobile' },
    { name: 'Intel', logoUrl: 'https://logo.clearbit.com/intel.com', industry: 'Semiconductors' },
    { name: 'Cisco', logoUrl: 'https://logo.clearbit.com/cisco.com', industry: 'Networking' },
    { name: 'L&T Construction', logoUrl: 'https://logo.clearbit.com/larsentoubro.com', industry: 'Construction' }
  ];

  const filteredNotices = notices.filter((notice) => {
    const titleStr = String(notice.title || '').toLowerCase();
    const msgStr = String(notice.message || '').toLowerCase();
    const matchesSearch = titleStr.includes(noticeSearchTerm.toLowerCase()) || 
                          msgStr.includes(noticeSearchTerm.toLowerCase());
    
    if (noticeCategoryFilter === 'all') return matchesSearch;
    
    const isJob = notice.driveType === 'placement' || titleStr.includes('job') || titleStr.includes('placement') || titleStr.includes('hiring') || titleStr.includes('recruitment');
    const isInternship = notice.driveType === 'internship' || titleStr.includes('internship') || titleStr.includes('intern');
    
    if (noticeCategoryFilter === 'jobs') return matchesSearch && isJob;
    if (noticeCategoryFilter === 'internships') return matchesSearch && isInternship;
    if (noticeCategoryFilter === 'circulars') return matchesSearch && !isJob && !isInternship;
    
    return matchesSearch;
  });

  try {
    return (
    <div className="min-h-screen bg-dot-pattern bg-gray-50 dark:bg-slate-950 transition-colors duration-300 text-gray-800 dark:text-gray-150 flex flex-col font-sans relative overflow-hidden">
      
      {/* Dynamic Animated Blobs in the Global Background */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-pink-400/5 dark:bg-violet-600/5 rounded-full blur-3xl animate-blob pointer-events-none z-0" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-b border-gray-200/40 dark:border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.01)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="bg-white p-1 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 animate-float-slow flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                GEC Gopalganj
              </span>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                Training & Placement Cell
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/placed-students"
              className="hidden sm:inline-block px-3 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              Placed Directory
            </Link>
            <Link
              to="/tpo-coordinators"
              className="hidden sm:inline-block px-3 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              T&P Cell Team
            </Link>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-inner"
              title="Toggle Theme"
              id="theme-toggler"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-650" />}
            </button>
            
            {currentUser ? (
              <Link
                to="/student"
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:scale-105"
                id="header-dashboard-btn"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-2.5 rounded-xl text-gray-750 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 font-bold text-sm transition-colors"
                  id="header-login-btn"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:scale-105"
                  id="header-register-btn"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>      {/* Main Hero & Intro Section */}
      <main className="flex-1 relative z-10">
        <section className="relative pt-4 pb-6 sm:pt-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-7xl mx-auto">
              
              {/* College Info & Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/40 dark:bg-indigo-500/5 border border-white/80 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] sm:text-xs mb-3 shadow-sm">
                <Award className="w-4 h-4 text-indigo-500" />
                Approved by AICTE & Affiliated to BEU, Patna
              </div>

              {/* Catchy Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-650 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  GEC Gopalganj
                </span>{" "}
                TNP Portal
              </h1>
              
              {/* Short College T&P Introduction */}
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Government Engineering College (GEC), Gopalganj is one of the premier state-funded institutions in Bihar.
                Our dedicated Training & Placement Cell bridges the gap between campus talent and industry requirements,
                equipping engineers with cutting-edge expertise and securing placements in industry-leading giants.
              </p>

              {/* Responsive Double Column Grid: Image Carousel & scrollable Notice Board */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-6 text-left">
                {/* College Campus Slideshow Carousel (Left: lg:col-span-8) */}
                <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden border border-white/60 dark:border-indigo-500/10 shadow-lg min-h-[240px] sm:min-h-[300px] lg:min-h-[340px] h-[340px] group flex flex-col justify-end bg-slate-900/95 dark:bg-slate-950/95">
                  {/* Current Slide Image Background */}
                  {carouselSlides.length > 0 && (
                    <img 
                      src={carouselSlides[activeSlide]?.image}
                      alt={carouselSlides[activeSlide]?.title || 'Campus Slide'}
                      className="absolute inset-0 w-full h-full object-contain transition-all duration-750 ease-in-out scale-100 group-hover:scale-100"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=675&q=80";
                      }}
                    />
                  )}
                  
                  {/* Left/Right floating controls */}
                  <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % carouselSlides.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute top-4 right-4 z-20 flex space-x-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-white/10">
                    {carouselSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeSlide === index ? 'w-4 bg-blue-500' : 'w-1.5 bg-white/50 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Real-time scrollable Notice Board Panel (Right: lg:col-span-4) */}
                <div className="lg:col-span-4 backdrop-blur-xl bg-white/45 dark:bg-slate-900/40 border border-white/60 dark:border-indigo-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-[2rem] p-5 flex flex-col h-[240px] sm:h-[300px] lg:h-[340px]">
                  <div className="border-b border-gray-150/40 dark:border-indigo-500/10 pb-3 mb-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-indigo-500 animate-bounce" />
                      <span className="font-bold text-sm tracking-wide text-gray-900 dark:text-white uppercase text-[12px]">
                        Latest News / Updates
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowNoticesModal(true)}
                      className="text-xs font-bold text-blue-600 dark:text-indigo-400 hover:text-blue-700 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {/* News Feed Scroll Container */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                    {notices.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-gray-400">
                        <Megaphone className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-xs font-semibold">No active updates</span>
                      </div>
                    ) : (
                      notices.map((notice) => {
                        const noticeTitleStr = String(notice.title || '').toLowerCase();
                        const isJob = notice.driveType === 'placement' || noticeTitleStr.includes('job') || noticeTitleStr.includes('placement') || noticeTitleStr.includes('hiring') || noticeTitleStr.includes('recruitment');
                        const isInternship = notice.driveType === 'internship' || noticeTitleStr.includes('internship') || noticeTitleStr.includes('intern');
                        
                        return (
                          <div
                            key={notice.id}
                            onClick={() => setActiveNoticeDetail(notice)}
                            className="flex items-start gap-3 p-3 bg-white/40 dark:bg-slate-900/35 border border-gray-150/40 dark:border-slate-800/40 hover:border-indigo-500/20 hover:bg-white/80 dark:hover:bg-slate-800/50 rounded-2xl shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden"
                          >
                            {/* Urgency indicator strip */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                              notice.priority === 'urgent' ? 'bg-red-500 shadow-[1px_0_6px_rgba(239,68,68,0.4)]' :
                              notice.priority === 'high' ? 'bg-orange-500 shadow-[1px_0_6px_rgba(249,115,22,0.4)]' :
                              'bg-blue-500 shadow-[1px_0_6px_rgba(59,130,246,0.4)]'
                            }`} />

                            {/* Date Badge */}
                            <div className="px-2 py-1.5 rounded-lg border border-gray-250/20 bg-gray-50/50 dark:bg-slate-950/40 dark:border-slate-850 text-[10px] font-extrabold text-gray-600 dark:text-gray-400 shrink-0 text-center flex flex-col justify-center min-w-[72px] shadow-sm leading-tight pl-2">
                              {formatNoticeDate(notice.createdAt).split(',')[0]}
                            </div>

                            {/* Categories and Title */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className="bg-blue-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  News
                                </span>
                                <span className="bg-orange-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Notice
                                </span>
                                {notice.priority === 'urgent' && (
                                  <span className="bg-red-550 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                                {notice.title}
                              </h4>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Call To Action Buttons & Stats Dashboard Area */}
              <div className="mt-12 max-w-5xl mx-auto text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleApplyClick('placement')}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-650 to-violet-650 hover:from-blue-700 hover:to-violet-750 text-white font-bold text-sm sm:text-base transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.45)] hover:scale-105 flex items-center justify-center gap-2 group"
                    id="hero-job-apply-btn"
                  >
                    Apply for Jobs
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleApplyClick('internship')}
                    className="px-8 py-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border-2 border-white/60 dark:border-indigo-500/20 hover:border-indigo-500 text-gray-805 dark:text-white font-bold text-sm sm:text-base transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2"
                    id="hero-internship-apply-btn"
                  >
                    Apply for Internships
                    <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </div>

                {/* Quick Placement Stats Dashboard */}
                <div className="mt-12 backdrop-blur-xl bg-white/45 dark:bg-slate-900/40 border border-white/80 dark:border-indigo-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-3xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative text-center">
                  <div className="relative">
                    <span className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
                      {stats.placementRate}
                    </span>
                    <span className="block mt-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Placements Rate
                    </span>
                    <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="border-l border-gray-200/40 dark:border-indigo-500/10">
                    <span className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-450 dark:to-violet-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
                      {stats.highestPackage}
                    </span>
                    <span className="block mt-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Highest Package
                    </span>
                  </div>
                  <div className="border-l border-gray-200/40 dark:border-indigo-500/10">
                    <span className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
                      {stats.recruiterCount}
                    </span>
                    <span className="block mt-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Recruiter Partners
                    </span>
                  </div>
                  <div className="border-l border-gray-200/40 dark:border-indigo-500/10">
                    <span className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
                      {stats.activeInternships}
                    </span>
                    <span className="block mt-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Active Internships
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Placed & Intern Students Showcase Card Grid */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
                Spotlight on Excellence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-1">
                Our Placed & Interned Stars
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mx-auto mt-4 rounded-full shadow-inner" />
              <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                GEC Gopalganj takes immense pride in presenting our bright minds who have secured excellent job packages and high-quality internship placements at leading organizations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {placedStudents.map((student, index) => (
                <div 
                  key={index}
                  className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-indigo-500/10 hover:border-indigo-500/35 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)] dark:hover:shadow-[0_20px_50px_rgba(99,102,241,0.18)] transition-all hover:-translate-y-2 duration-500 flex flex-col justify-between group overflow-hidden"
                >
                  {/* Subtle inner decorative glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                  
                  {/* Package/Stipend Tag */}
                  <div className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-indigo-950/40 text-blue-700 dark:text-indigo-300 font-bold text-xs border border-blue-100/60 dark:border-indigo-900/30 shadow-sm">
                    {student.package}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${student.bgColor} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                        {student.avatar}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight max-w-[140px] truncate">
                          {student.name}
                        </h4>
                        <span className="text-xs font-semibold text-gray-450 dark:text-gray-500">
                          {student.year}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-indigo-500/10 space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-450 font-semibold">Recruiter:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{student.company}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-450 font-semibold">Branch:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 max-w-[200px] truncate text-right">
                          {student.branch}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-450 font-semibold">Offer Type:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.type === 'Placement'
                            ? 'bg-emerald-100/65 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200/20 dark:border-emerald-900/30'
                            : 'bg-indigo-100/65 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-450 border border-indigo-200/20 dark:border-indigo-900/30'
                        }`}>
                          {student.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Placed Students CTA Button */}
            <div className="mt-12 text-center">
              <Link
                to="/placed-students"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105 text-sm sm:text-base group"
              >
                <span>View All Placed Students</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Recruiter Partners Showcase */}
        <section className="py-16 border-t border-b border-gray-200/40 dark:border-indigo-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
                Our Corporate Network
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                Our Recruiter Partners
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-3 rounded-full shadow-inner" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                We are proud to have our graduates selected by premier global and domestic engineering organizations.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center items-center">
              {(recruiters.length > 0 ? recruiters : fallbackRecruiters).map((rec, index) => (
                <a
                  key={index}
                  href={rec.website || '#'}
                  target={rec.website ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="backdrop-blur-md bg-white/40 dark:bg-slate-900/30 border border-white/60 dark:border-indigo-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:border-indigo-500/30 hover:shadow-lg dark:hover:bg-slate-900/50 group h-32"
                >
                  <RecruiterLogo 
                     logoUrl={rec.logoUrl} 
                     name={rec.name} 
                     initials={getAvatarInitials(rec.name)} 
                  />
                  <span className="font-extrabold text-gray-850 dark:text-white text-xs sm:text-sm tracking-tight truncate max-w-full">
                    {rec.name}
                  </span>
                  <span className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5 font-medium truncate max-w-full">
                    {rec.industry || 'General Industry'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Live / Newly Listed Job & Internship Openings */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
                  Active Recruitments
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-1">
                  Active Openings & Drives
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-650 mt-4 rounded-full shadow-inner" />
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                  Check out the newly listed job opportunities and internship openings at GEC Gopalganj. Sign up or log in to submit your profile.
                </p>
              </div>
              <div className="mt-6 md:mt-0 flex gap-3 z-10">
                <button
                  onClick={() => handleApplyClick('placement')}
                  className="px-4.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-xs sm:text-sm font-bold border border-white/60 dark:border-indigo-500/10 hover:border-indigo-500 text-gray-800 dark:text-white shadow-sm transition-all hover:scale-105"
                >
                  View All Jobs
                </button>
                <button
                  onClick={() => handleApplyClick('internship')}
                  className="px-4.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-xs sm:text-sm font-bold border border-white/60 dark:border-indigo-500/10 hover:border-teal-500 text-gray-800 dark:text-white shadow-sm transition-all hover:scale-105"
                >
                  View All Internships
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {drives.map((drive) => (
                <div 
                  key={drive.id}
                  className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/80 dark:border-indigo-500/10 hover:border-indigo-500/30 hover:shadow-[0_20px_45px_rgba(99,102,241,0.06)] dark:hover:shadow-[0_20px_45px_rgba(99,102,241,0.15)] rounded-[2rem] p-6 shadow-md transition-all hover:-translate-y-1.5 duration-500 flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    {/* Drive Card Top Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        drive.driveType === 'placement'
                          ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-150/40 dark:border-indigo-900/40'
                          : 'bg-teal-50/80 text-teal-700 dark:bg-teal-950/40 dark:text-teal-455 border-teal-150/40 dark:border-teal-900/40'
                      }`}>
                        {drive.driveType === 'placement' ? 'Job Drive' : 'Internship'}
                      </span>
                      <span className="text-xs font-semibold text-gray-450 dark:text-gray-500">
                        Deadline: {formatDeadline(drive.deadline)}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                      {drive.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-450 text-sm font-bold mt-1">
                      {drive.company}
                    </p>

                    <div className="mt-6 space-y-3 bg-gray-55/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-gray-150/40 dark:border-indigo-500/5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-450 font-semibold">Offer Package:</span>
                        <span className="font-bold text-gray-805 dark:text-gray-250">{drive.package}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-455 font-semibold">Eligible:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={typeof drive.eligibility === 'string' ? drive.eligibility : 'Refer description'}>
                          {formatEligibility(drive.eligibility)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative z-10">
                    <button
                      onClick={() => handleApplyClick(drive.driveType)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] ${
                        drive.driveType === 'placement'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white shadow-blue-500/10'
                          : 'bg-gradient-to-r from-teal-600 to-emerald-650 hover:from-teal-700 hover:to-emerald-750 text-white shadow-teal-500/10'
                      }`}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>        {/* Dynamic Notices & Announcements Section */}
        <section className="py-20 border-t border-gray-200/40 dark:border-indigo-500/10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 mb-2">
                <Bell className="w-4 h-4 text-indigo-500 animate-bounce" />
                Latest Announcements
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-1">
                Circulars & Notice Board
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-650 mx-auto mt-4 rounded-full shadow-inner" />
              <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Stay informed with the latest updates, circulars, drive guidelines, and placement notifications published by the Training & Placement Cell.
              </p>
            </div>

            {notices.length === 0 ? (
              <div className="text-center py-16 backdrop-blur-md bg-white/40 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-indigo-500/10 max-w-xl mx-auto shadow-sm">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-bold text-base">No notifications posted yet</p>
              </div>
            ) : (
              <div className="space-y-5 max-w-5xl mx-auto">
                {notices.slice(0, 3).map((notice) => {
                  const noticeTitleStr = String(notice.title || '').toLowerCase();
                  const isJob = notice.driveType === 'placement' || noticeTitleStr.includes('job') || noticeTitleStr.includes('placement') || noticeTitleStr.includes('hiring') || noticeTitleStr.includes('recruitment');
                  const isInternship = notice.driveType === 'internship' || noticeTitleStr.includes('internship') || noticeTitleStr.includes('intern');
                  
                  return (
                    <div 
                      key={notice.id}
                      className="relative bg-white/40 dark:bg-slate-900/45 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 dark:border-indigo-500/10 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_15px_40px_rgba(99,102,241,0.06)] dark:hover:shadow-[0_15px_40px_rgba(99,102,241,0.15)] hover:border-indigo-500/25 group overflow-hidden"
                    >
                      {/* Urgency side indicator with glow overlay */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        notice.priority === 'urgent' ? 'bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.5)]' :
                        notice.priority === 'high' ? 'bg-orange-500 shadow-[2px_0_10px_rgba(249,115,22,0.5)]' :
                        notice.priority === 'low' ? 'bg-gray-400' : 'bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]'
                      }`} />

                      <div className="flex flex-col sm:flex-row gap-4 items-start flex-1 w-full pl-2">
                        {/* Circle Icon Container */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border transition-transform duration-300 group-hover:scale-105 ${
                          isJob 
                            ? 'bg-blue-50/80 border-blue-100 text-blue-600 dark:bg-blue-955/20 dark:border-blue-900/40 dark:text-blue-400' 
                            : isInternship 
                              ? 'bg-teal-50/80 border-teal-100 text-teal-600 dark:bg-teal-955/20 dark:border-teal-900/40 dark:text-teal-450' 
                              : 'bg-indigo-50/80 border-indigo-100 text-indigo-650 dark:bg-indigo-955/20 dark:border-indigo-900/40 dark:text-indigo-400'
                        }`}>
                          {isJob ? (
                            <Briefcase className="w-5.5 h-5.5" />
                          ) : isInternship ? (
                            <GraduationCap className="w-5.5 h-5.5" />
                          ) : (
                            <Megaphone className="w-5.5 h-5.5" />
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getNoticePriorityBadge(notice.priority)}`}>
                              {notice.priority || 'normal'}
                            </span>
                            
                            {notice.targetBranch ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-slate-950/40 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-indigo-500/10">
                                {notice.targetBranch}
                              </span>
                            ) : notice.target && notice.target !== 'all' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-slate-955/40 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-indigo-500/10">
                                {notice.target}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/40 dark:border-blue-900/40">
                                All Batches
                              </span>
                            )}
                            <span className="text-xs font-semibold text-gray-450 dark:text-gray-555 flex items-center gap-1 sm:ml-auto">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatNoticeDate(notice.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                            {notice.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-350 text-sm leading-relaxed whitespace-pre-line mt-2">
                            {notice.message}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Block (Action Button or Status Info) */}
                      <div className="shrink-0 flex items-center w-full md:w-auto pl-2 md:pl-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-150/40 dark:border-indigo-500/10 justify-between md:justify-end gap-4 min-w-[130px] z-10">
                        {(isJob || isInternship) ? (
                          <button
                            onClick={() => handleApplyClick(isJob ? 'placement' : 'internship')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 hover:scale-105 border ${
                              isJob 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white border-blue-500/25' 
                                : 'bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-700 hover:to-emerald-755 text-white border-teal-500/25'
                            }`}
                          >
                            Apply Now
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-450 dark:text-gray-500 flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/50 dark:border-indigo-500/5 shadow-inner">
                            <Bell className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            Circular Notice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {notices.length > 0 && (
              <div className="mt-12 text-center relative z-10">
                <button
                  onClick={() => setShowNoticesModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105 text-sm sm:text-base group"
                >
                  <span>View All Circulars & Notices</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Best-In-Class College Footer Bar */}
      <footer className="bg-slate-950 text-gray-400 border-t border-gray-900 shadow-2xl transition-colors relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Column 1: College Intro & Logo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5 text-white">
                <div className="bg-white p-1 rounded-2xl flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-xl" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white">
                    GEC Gopalganj
                  </span>
                  <p className="text-[9px] tracking-wider font-semibold text-gray-500 uppercase">
                    Training & Placement Cell
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Government Engineering College (GEC), Gopalganj is an academic hub in North Bihar committed to training next-gen engineers, sparking research advancements, and fostering direct recruitment channels.
              </p>
              <div className="flex space-x-3 pt-2">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-gray-400 hover:text-white border border-gray-800/40 hover:border-blue-500/20 transition-all hover:scale-105">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-700 text-gray-400 hover:text-white border border-gray-800/40 hover:border-blue-500/20 transition-all hover:scale-105">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-650 text-gray-400 hover:text-white border border-gray-800/40 hover:border-red-500/20 transition-all hover:scale-105">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6 relative">
                Quick Navigation
                <span className="block w-8 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 absolute bottom-[-8px] left-0 rounded-full shadow-sm" />
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    Home Page
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    Student Log In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    Student Register
                  </Link>
                </li>
                <li>
                  <Link to="/company-register" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    Recruiter Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/placed-students" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    Placed Directory
                  </Link>
                </li>
                <li>
                  <Link to="/tpo-coordinators" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    T&P Cell Team
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Useful State Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6 relative">
                Important Portals
                <span className="block w-8 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-650 absolute bottom-[-8px] left-0 rounded-full shadow-sm" />
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="https://beu-bihar.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <Globe className="w-3.5 h-3.5 group-hover:text-blue-550" />
                    BEU Patna Portal
                  </a>
                </li>
                <li>
                  <a href="https://dst.bihar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <Globe className="w-3.5 h-3.5 group-hover:text-blue-550" />
                    DST, Govt of Bihar
                  </a>
                </li>
                <li>
                  <a href="https://aicte-india.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <Globe className="w-3.5 h-3.5 group-hover:text-blue-550" />
                    AICTE Official Web
                  </a>
                </li>
                <li>
                  <a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-1 group">
                    <Globe className="w-3.5 h-3.5 group-hover:text-blue-550" />
                    National Scholarships
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Campus Info */}
            <div className="space-y-4 text-sm">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6 relative">
                Campus Location
                <span className="block w-8 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-650 absolute bottom-[-8px] left-0 rounded-full shadow-sm" />
              </h4>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Government Engineering College, Gopalganj, Sipaya, Bihar - 841501, India.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <a href="mailto:tnp@gecgopalganj.org.in" className="hover:text-blue-500 transition-colors">
                  gecgopalganjtpo@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <p>Please email us </p>
              </div>
            </div>
 
          </div>

          {/* Divider */}
          <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-xs">
            <p className="text-center md:text-left">
              &copy; 2026 Government Engineering College, Gopalganj. All Rights Reserved.
            </p>
            <p className="mt-2 md:mt-0 text-center md:text-right text-gray-500">
              Designed & Managed by GEC Gopalganj Training & Placement Cell.
            </p>
          </div>

        </div>
      </footer>

      {/* Guest Authentication Prompt Dialog Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 relative border border-white/60 dark:border-indigo-500/15 transform transition-transform scale-100">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors"
              id="close-auth-modal-btn"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-indigo-400 border border-blue-100/40 dark:border-indigo-800/30">
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Registration / Login Required
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-450 leading-relaxed">
                To apply for any job or internship drives listed on the GEC Gopalganj portal, you must be registered and logged in as a student candidate.
              </p>

              <div className="pt-4 space-y-3">
                <Link
                  to={`/login?redirect=apply-${selectedDriveType}`}
                  className="block w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/10 hover:scale-102 text-center"
                  id="auth-modal-login-btn"
                >
                  Log In to Apply
                </Link>
                <Link
                  to="/register"
                  className="block w-full py-3 rounded-2xl bg-gray-100/90 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-sm transition-all text-center"
                  id="auth-modal-register-btn"
                >
                  Register Now
                </Link>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline"
                >
                  Go Back to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Notices Dynamic Searchable Overlay Modal */}
      {showNoticesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] max-w-4xl w-full shadow-2xl p-6 sm:p-8 relative border border-white/70 dark:border-indigo-500/20 flex flex-col max-h-[90vh]">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowNoticesModal(false);
                setNoticeSearchTerm('');
                setNoticeCategoryFilter('all');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors z-10"
              id="close-notices-modal-btn"
            >
              <XCircle className="w-7 h-7" />
            </button>

            {/* Modal Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-indigo-400 border border-blue-100/40 dark:border-indigo-800/30">
                <Bell className="w-6 h-6 text-indigo-500 animate-swing" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-950 dark:text-white">
                  Circulars & Notice Board
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Search and browse through all active placement drives, internships, and official cell notices.
                </p>
              </div>
            </div>

            {/* Search and Filters Strip */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-4 border-b border-gray-150/40 dark:border-indigo-500/10">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notices by title, company, or keywords..."
                  value={noticeSearchTerm}
                  onChange={(e) => setNoticeSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border border-gray-200/50 dark:border-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-400 text-gray-800 dark:text-gray-150"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                {['all', 'jobs', 'internships', 'circulars'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategoryFilter(cat)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
                      noticeCategoryFilter === cat
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-650 border-blue-600 text-white shadow-md'
                        : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-gray-200/50 dark:border-indigo-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-950/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Notices List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[60vh] custom-scrollbar">
              {filteredNotices.length === 0 ? (
                <div className="text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-gray-200/40 dark:border-indigo-500/10 max-w-md mx-auto my-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-gray-950 dark:text-white font-bold">No results found</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4">
                    We couldn't find any notices matching your filters or search query. Try clearing your search keyword.
                  </p>
                </div>
              ) : (
                filteredNotices.map((notice) => {
                  const noticeTitleStr = String(notice.title || '').toLowerCase();
                  const isJob = notice.driveType === 'placement' || noticeTitleStr.includes('job') || noticeTitleStr.includes('placement') || noticeTitleStr.includes('hiring') || noticeTitleStr.includes('recruitment');
                  const isInternship = notice.driveType === 'internship' || noticeTitleStr.includes('internship') || noticeTitleStr.includes('intern');
                  
                  return (
                    <div 
                      key={notice.id}
                      className="relative bg-white/40 dark:bg-slate-900/45 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50 dark:border-indigo-500/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:bg-white/60 dark:hover:bg-slate-950/50 group overflow-hidden"
                    >
                      {/* Urgency side indicator */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        notice.priority === 'urgent' ? 'bg-red-500' :
                        notice.priority === 'high' ? 'bg-orange-500' :
                        notice.priority === 'low' ? 'bg-gray-400' : 'bg-blue-500'
                      }`} />

                      <div className="flex flex-col sm:flex-row gap-4 items-start flex-1 w-full pl-2">
                        {/* Circle Icon Container */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105 ${
                          isJob 
                            ? 'bg-blue-50/80 border-blue-100 text-blue-600 dark:bg-blue-955/20 dark:border-blue-900/40 dark:text-blue-400' 
                            : isInternship 
                              ? 'bg-teal-50/80 border-teal-100 text-teal-600 dark:bg-teal-955/20 dark:border-teal-900/40 dark:text-teal-450' 
                              : 'bg-indigo-50/80 border-indigo-100 text-indigo-650 dark:bg-indigo-955/20 dark:border-indigo-900/40 dark:text-indigo-400'
                        }`}>
                          {isJob ? (
                            <Briefcase className="w-5.5 h-5.5" />
                          ) : isInternship ? (
                            <GraduationCap className="w-5.5 h-5.5" />
                          ) : (
                            <Megaphone className="w-5.5 h-5.5" />
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${getNoticePriorityBadge(notice.priority)}`}>
                              {notice.priority || 'normal'}
                            </span>
                            
                            {notice.targetBranch ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/50 dark:bg-slate-950/40 text-gray-500 dark:text-gray-400 border border-gray-205 dark:border-indigo-500/10">
                                {notice.targetBranch}
                              </span>
                            ) : notice.target && notice.target !== 'all' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/50 dark:bg-slate-955/40 text-gray-500 dark:text-gray-400 border border-gray-205 dark:border-indigo-500/10">
                                {notice.target}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/40 dark:border-blue-900/40">
                                All Batches
                              </span>
                            )}

                             <span className="text-[10px] font-semibold text-gray-450 dark:text-gray-555 flex items-center gap-1 sm:ml-auto">
                               <Calendar className="w-3.5 h-3.5 text-gray-400" />
                               {formatNoticeDate(notice.createdAt)}
                             </span>
                          </div>

                          <h4 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                            {notice.title}
                          </h4>
                          
                          <p className="text-gray-650 dark:text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line mt-1.5">
                            {notice.message}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Block (Action Button or Status Info) */}
                      <div className="shrink-0 flex items-center w-full sm:w-auto pl-2 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-150/40 dark:border-indigo-500/10 justify-between sm:justify-end gap-3 min-w-[120px] z-10">
                        {(isJob || isInternship) ? (
                          <button
                            onClick={() => {
                              setShowNoticesModal(false);
                              handleApplyClick(isJob ? 'placement' : 'internship');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 hover:scale-105 border ${
                              isJob 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white border-blue-500/25' 
                                : 'bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-700 hover:to-emerald-755 text-white border-teal-500/25'
                            }`}
                          >
                            Apply Now
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-white/50 dark:border-indigo-500/5 shadow-inner">
                            <Bell className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            Circular Notice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-gray-150/40 dark:border-indigo-500/10 flex justify-between items-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">
              <span>Showing {filteredNotices.length} of {notices.length} notices</span>
              <button
                onClick={() => {
                  setShowNoticesModal(false);
                  setNoticeSearchTerm('');
                  setNoticeCategoryFilter('all');
                }}
                className="text-blue-600 hover:text-blue-750 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors uppercase tracking-wider"
              >
                Close Notice Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal Overlay */}
      {activeNoticeDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setActiveNoticeDetail(null)}
          />
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] max-w-xl w-full shadow-2xl p-6 sm:p-8 relative border border-white/70 dark:border-indigo-500/20 flex flex-col z-10 max-h-[85vh] animate-scale-up text-left">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveNoticeDetail(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors z-20"
            >
              <XCircle className="w-7 h-7" />
            </button>

            {/* Header / Category Badge */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getNoticePriorityBadge(activeNoticeDetail.priority)}`}>
                {activeNoticeDetail.priority || 'normal'}
              </span>
              {activeNoticeDetail.targetBranch && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-55/20 text-indigo-750 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-150/40 dark:border-indigo-900/40">
                  {activeNoticeDetail.targetBranch}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-955 dark:text-white leading-snug mb-4">
              {activeNoticeDetail.title}
            </h3>

            {/* Date and Sender */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-150/45 dark:border-indigo-500/10 pb-4 mb-6">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Published on {formatNoticeDate(activeNoticeDetail.createdAt)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-1" />
              <span>T&P Cell</span>
            </div>

            {/* Message scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-gray-650 dark:text-gray-300 leading-relaxed whitespace-pre-line pr-1">
              {activeNoticeDetail.message}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-gray-150/45 dark:border-indigo-500/10 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setActiveNoticeDetail(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-355 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              >
                Close Notice
              </button>
              {(activeNoticeDetail.driveType || activeNoticeDetail.isRawDrive) && (
                <button
                  onClick={() => {
                    setActiveNoticeDetail(null);
                    handleApplyClick(activeNoticeDetail.driveType || 'placement');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
  } catch (error) {
    console.error("Home Render Crash:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-red-200 dark:border-red-900/50">
          <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="w-8 h-8 font-bold" />
            <h3 className="text-2xl font-bold">Homepage Render Crash Detected</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            An error occurred while rendering the GEC Gopalganj homepage. Here are the technical details:
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 text-red-800 dark:text-red-200 font-mono text-sm overflow-x-auto mb-6">
            <p className="font-bold mb-2">Error: {error.message}</p>
            <pre className="text-xs max-h-60 overflow-y-auto whitespace-pre-wrap">{error.stack}</pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default Home;
