import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from './components/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminClassManagement from './pages/AdminClassManagement';
import AdminFileManagement from './pages/AdminFileManagement';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AssignmentManagement from './pages/AssignmentManagement';
import AssignmentDetail from './pages/AssignmentDetail';
import ClassDetail from './pages/ClassDetail';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard routes with layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/classes" element={<AdminClassManagement />} />
          <Route path="/admin/files" element={<AdminFileManagement />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/assignments" element={<AssignmentManagement />} />
          <Route path="/assignment/:id" element={<AssignmentDetail />} />
          <Route path="/class/:classId" element={<ClassDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}


export default App;
