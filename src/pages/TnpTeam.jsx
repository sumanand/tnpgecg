import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { useTheme } from '../contexts/ThemeContext';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Mail, 
  Phone, 
  ArrowLeft,
  Users,
  Award,
  BookOpen,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const TnpTeam = () => {
  const { darkMode, setDarkMode } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const teamSnap = await get(ref(db, 'companies'));
      const list = [];
      if (teamSnap.exists()) {
        teamSnap.forEach((child) => {
          const val = child.val();
          if (val.isTnpTeam === true) {
            list.push({ id: child.key, ...val });
          }
        });
      }
      setMembers(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getAvatarInitials = (name) => {
    if (!name) return 'TP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getRandomBgColor = (name) => {
    const gradients = [
      "from-blue-600 to-indigo-600 shadow-blue-500/10",
      "from-purple-650 to-pink-650 shadow-purple-500/10",
      "from-teal-600 to-emerald-600 shadow-teal-500/10",
      "from-amber-600 to-orange-650 shadow-amber-500/10",
      "from-cyan-600 to-blue-600 shadow-cyan-500/10",
      "from-rose-600 to-red-600 shadow-rose-500/10"
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Group members into their strict categories
  const principals = members.filter(m => m.category === 'Principal');
  const tpos = members.filter(m => m.category === 'TPO');
  const coordinators = members.filter(m => m.category === 'T&P coordinator');
  const studentCoordinators = members.filter(m => m.category === 'T&P student coordinator');

  // Hardcoded fallback data to show when database node is empty
  const fallbackPrincipals = [{
    name: "Dr. R. K. Singh",
    designation: "Principal, GEC Gopalganj",
    department: "Administration",
    email: "principal@gecgopalganj.ac.in",
    phone: "06156-295111"
  }];

  const fallbackTpos = [{
    name: "Prof. Sandeep Kumar",
    designation: "Head, Training & Placement Cell",
    department: "Civil Engineering",
    email: "tpo@gecgopalganj.ac.in",
    phone: "+91 9876543219"
  }];

  const fallbackCoordinators = [
    {
      name: "Prof. Amit Verma",
      designation: "Assistant Professor & Faculty Coordinator",
      department: "Mechanical Engineering",
      email: "amit.coordinator@gecgopalganj.ac.in",
      phone: "+91 9876543211"
    },
    {
      name: "Prof. Ritu Kumari",
      designation: "Assistant Professor & Faculty Coordinator",
      department: "Electronics & Communication",
      email: "ritu.coordinator@gecgopalganj.ac.in",
      phone: "+91 9876543214"
    },
    {
      name: "Prof. Rahul Dev",
      designation: "Assistant Professor & Faculty Representative",
      department: "Computer Science Engineering",
      email: "rahul.coordinator@gecgopalganj.ac.in",
      phone: "+91 9876543217"
    }
  ];

  const fallbackStudents = [
    {
      name: "Anjali Priya",
      designation: "Student T&P Representative",
      department: "Computer Science Engineering",
      email: "anjali.cse22@gecgopalganj.ac.in",
      phone: "+91 9876543212"
    },
    {
      name: "Sunny Kumar",
      designation: "Student T&P Coordinator",
      department: "Electrical Engineering",
      email: "sunny.ee22@gecgopalganj.ac.in",
      phone: "+91 9876543201"
    }
  ];

  const finalPrincipals = principals.length > 0 ? principals : fallbackPrincipals;
  const finalTpos = tpos.length > 0 ? tpos : fallbackTpos;
  const finalCoordinators = coordinators.length > 0 ? coordinators : fallbackCoordinators;
  const finalStudents = studentCoordinators.length > 0 ? studentCoordinators : fallbackStudents;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 text-gray-800 dark:text-gray-100 flex flex-col font-sans">
      
      {/* Header navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-250/30 dark:border-gray-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-650 dark:text-blue-400 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                GEC Gopalganj
              </span>
              <p className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                Training & Placement Cell
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-inner"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-650" />}
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/10 hover:scale-105 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* Banner titles */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-800 shadow-sm uppercase tracking-wider">
            <Award className="w-4 h-4" />
            T&P Cell Leadership Board
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Our Officers & Coordinators
          </h1>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full" />
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Meet the administration, faculty members, and student coordinators who steer the professional recruitment cell and shape careers at GEC Gopalganj.
          </p>
        </div>

        {/* 1. PRINCIPAL (Top visual tier) */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white uppercase tracking-wider text-center">
              Patron & Administration
            </h3>
          </div>

          <div className="flex justify-center">
            {finalPrincipals.map((principal, i) => (
              <div 
                key={i}
                className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 dark:border-purple-900/40 hover:-translate-y-1.5 transition-transform duration-300 flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
              >
                {principal.photoUrl ? (
                  <img
                    src={principal.photoUrl}
                    alt={principal.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-purple-50 dark:border-purple-900 shadow-lg shrink-0"
                  />
                ) : (
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${getRandomBgColor(principal.name)} text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-lg shrink-0 border-4 border-purple-50 dark:border-purple-900`}>
                    {getAvatarInitials(principal.name)}
                  </div>
                )}
                
                <div className="text-center sm:text-left space-y-2 flex-grow">
                  <span className="inline-block text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-0.5 rounded-full font-bold uppercase border border-purple-100 dark:border-purple-800">
                    College Patron
                  </span>
                  <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {principal.name}
                  </h4>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {principal.designation}
                  </p>
                  <p className="text-xs text-gray-450 dark:text-gray-500 font-medium">
                    {principal.department}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 text-xs justify-center sm:justify-start">
                    {principal.email && (
                      <a href={`mailto:${principal.email}`} className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        {principal.email}
                      </a>
                    )}
                    {principal.phone && (
                      <a href={`tel:${principal.phone}`} className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 hover:underline font-medium">
                        <Phone className="w-3.5 h-3.5" />
                        {principal.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. TPO (Second visual tier) */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white uppercase tracking-wider text-center">
              Training & Placement Officer
            </h3>
          </div>

          <div className="flex justify-center">
            {finalTpos.map((tpo, i) => (
              <div 
                key={i}
                className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100 dark:border-blue-900/40 hover:-translate-y-1.5 transition-transform duration-300 flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
              >
                {tpo.photoUrl ? (
                  <img
                    src={tpo.photoUrl}
                    alt={tpo.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-blue-50 dark:border-blue-900 shadow-lg shrink-0"
                  />
                ) : (
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${getRandomBgColor(tpo.name)} text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-lg shrink-0 border-4 border-blue-50 dark:border-blue-900`}>
                    {getAvatarInitials(tpo.name)}
                  </div>
                )}
                
                <div className="text-center sm:text-left space-y-2 flex-grow">
                  <span className="inline-block text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold uppercase border border-blue-100 dark:border-blue-800">
                    Placement Officer
                  </span>
                  <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {tpo.name}
                  </h4>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {tpo.designation}
                  </p>
                  <p className="text-xs text-gray-450 dark:text-gray-500 font-medium">
                    Department of {tpo.department}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 text-xs justify-center sm:justify-start">
                    {tpo.email && (
                      <a href={`mailto:${tpo.email}`} className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        {tpo.email}
                      </a>
                    )}
                    {tpo.phone && (
                      <a href={`tel:${tpo.phone}`} className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 hover:underline font-medium">
                        <Phone className="w-3.5 h-3.5" />
                        {tpo.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. FACULTY T&P COORDINATORS */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white uppercase tracking-wider text-center">
              Faculty T&P Coordinators
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {finalCoordinators.map((coord, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-teal-100/50 dark:border-teal-900/30 hover:-translate-y-1.5 transition-transform duration-350 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {coord.photoUrl ? (
                      <img
                        src={coord.photoUrl}
                        alt={coord.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm border dark:border-gray-700"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRandomBgColor(coord.name)} text-white flex items-center justify-center font-bold text-xl shadow-sm`}>
                        {getAvatarInitials(coord.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">
                        {coord.name}
                      </h4>
                      <span className="inline-block text-[9px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded font-bold uppercase mt-1">
                        Faculty Coord
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <p className="text-gray-800 dark:text-gray-200">{coord.designation}</p>
                    <p className="font-medium text-gray-400 dark:text-gray-500">Dept: {coord.department}</p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2 text-xs border-t border-gray-50 dark:border-gray-700/20 mt-4">
                  {coord.email && (
                    <a href={`mailto:${coord.email}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {coord.email}
                    </a>
                  )}
                  {coord.phone && (
                    <a href={`tel:${coord.phone}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:underline">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {coord.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. STUDENT T&P REPRESENTATIVES */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-6 h-6 text-indigo-650" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white uppercase tracking-wider text-center">
              Student T&P Coordinators
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {finalStudents.map((stud, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-indigo-100/50 dark:border-indigo-900/30 hover:-translate-y-1.5 transition-transform duration-350 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {stud.photoUrl ? (
                      <img
                        src={stud.photoUrl}
                        alt={stud.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm border dark:border-gray-700"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRandomBgColor(stud.name)} text-white flex items-center justify-center font-bold text-xl shadow-sm`}>
                        {getAvatarInitials(stud.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">
                        {stud.name}
                      </h4>
                      <span className="inline-block text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase mt-1">
                        Student Representative
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <p className="text-gray-800 dark:text-gray-200">{stud.designation}</p>
                    <p className="font-medium text-gray-400 dark:text-gray-500">Branch: {stud.department}</p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2 text-xs border-t border-gray-50 dark:border-gray-700/20 mt-4">
                  {stud.email && (
                    <a href={`mailto:${stud.email}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {stud.email}
                    </a>
                  )}
                  {stud.phone && (
                    <a href={`tel:${stud.phone}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:underline">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {stud.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-450 border-t border-gray-850 mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs">
          <p>&copy; 2026 Government Engineering College, Gopalganj T&P Cell. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default TnpTeam;
