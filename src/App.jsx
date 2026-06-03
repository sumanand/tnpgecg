import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CompanyRegister from './pages/Auth/CompanyRegister';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentProfile from './pages/Student/StudentProfile';
import PlacementDrives from './pages/Student/PlacementDrives';
import InternshipDrives from './pages/Student/InternshipDrives';
import Applications from './pages/Student/Applications';
import EligibilityChecker from './pages/Student/EligibilityChecker';
import PlacementHistory from './pages/Student/PlacementHistory';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageStudents from './pages/Admin/ManageStudents';
import ManageCompanies from './pages/Admin/ManageCompanies';
import ManageRecruiters from './pages/Admin/ManageRecruiters';
import ManageDrives from './pages/Admin/ManageDrives';
import ManageApplications from './pages/Admin/ManageApplications';
import Analytics from './pages/Admin/Analytics';
import Notices from './pages/Admin/Notices';
import ExportReports from './pages/Admin/ExportReports';
import BulkUploadPlacements from './pages/Admin/BulkUploadPlacements';
import BulkUploadStudents from './pages/Admin/BulkUploadStudents';
import ManageTeam from './pages/Admin/ManageTeam';
import TnpTeam from './pages/TnpTeam';

// Company Pages
import CompanyDashboard from './pages/Company/CompanyDashboard';
import PostJob from './pages/Company/PostJob';
import PostInternship from './pages/Company/PostInternship';
import ViewApplicants from './pages/Company/ViewApplicants';
import ShortlistCandidates from './pages/Company/ShortlistCandidates';
import Home from './pages/Home';
import PlacedStudents from './pages/PlacedStudents';

function AppRoutes() {
  const { userRole } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/company-register" element={<CompanyRegister />} />
      
      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/placements" element={<ProtectedRoute role="student"><PlacementDrives /></ProtectedRoute>} />
      <Route path="/student/internships" element={<ProtectedRoute role="student"><InternshipDrives /></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute role="student"><Applications /></ProtectedRoute>} />
      <Route path="/student/eligibility" element={<ProtectedRoute role="student"><EligibilityChecker /></ProtectedRoute>} />
      <Route path="/student/history" element={<ProtectedRoute role="student"><PlacementHistory /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute role="admin"><ManageCompanies /></ProtectedRoute>} />
      <Route path="/admin/recruiters" element={<ProtectedRoute role="admin"><ManageRecruiters /></ProtectedRoute>} />
      <Route path="/admin/drives" element={<ProtectedRoute role="admin"><ManageDrives /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute role="admin"><ManageApplications /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><Analytics /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute role="admin"><Notices /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><ExportReports /></ProtectedRoute>} />
      <Route path="/admin/upload-placements" element={<ProtectedRoute role="admin"><BulkUploadPlacements /></ProtectedRoute>} />
      <Route path="/admin/upload-students" element={<ProtectedRoute role="admin"><BulkUploadStudents /></ProtectedRoute>} />
      <Route path="/admin/team" element={<ProtectedRoute role="admin"><ManageTeam /></ProtectedRoute>} />
      
      {/* Company Routes */}
      <Route path="/company" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company/post-job" element={<ProtectedRoute role="company"><PostJob /></ProtectedRoute>} />
      <Route path="/company/post-internship" element={<ProtectedRoute role="company"><PostInternship /></ProtectedRoute>} />
      <Route path="/company/applicants" element={<ProtectedRoute role="company"><ViewApplicants /></ProtectedRoute>} />
      <Route path="/company/shortlist" element={<ProtectedRoute role="company"><ShortlistCandidates /></ProtectedRoute>} />
      
      <Route path="/placed-students" element={<PlacedStudents />} />
      <Route path="/tpo-coordinators" element={<TnpTeam />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;