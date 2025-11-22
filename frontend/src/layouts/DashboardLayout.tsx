import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Settings, LogOut, Users, User } from 'lucide-react';
import api from '../api/axios';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

interface SidebarItem {
    icon: React.ReactNode;
    label: string;
    path: string;
}

interface DashboardLayoutProps {
    userRole?: 'admin' | 'teacher' | 'student';
    schoolName?: string;
    userName?: string;
}

interface UserData {
    full_name: string;
    role: string;
    avatar_url?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userRole: propUserRole, schoolName }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState<UserData | null>(null);
    const userRole = propUserRole || (sessionStorage.getItem('userRole') as 'admin' | 'teacher' | 'student') || 'student';

    const fetchUser = async () => {
        try {
            const response = await api.get('/users/me');
            setUserData(response.data);
        } catch (error) {
            console.error('Failed to fetch user data', error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('userRole');
        navigate('/login');
    };

    // Inactivity Timeout Logic
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleLogout();
            }, INACTIVITY_LIMIT);
        };

        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Add listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Initial start
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, []);

    useEffect(() => {
        fetchUser();

        const handleUserUpdate = () => fetchUser();
        window.addEventListener('user-updated', handleUserUpdate);

        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
        };
    }, []);

    const getSidebarItems = (): SidebarItem[] => {
        const commonItems = [
            { icon: <Settings className="w-5 h-5" />, label: 'Cài đặt', path: '/settings' },
        ];

        if (userRole === 'admin') {
            return [
                { icon: <Users className="w-5 h-5" />, label: 'Quản lý Người dùng', path: '/admin-dashboard' },
                { icon: <BookOpen className="w-5 h-5" />, label: 'Quản lý Lớp học', path: '/admin/classes' },
                { icon: <FileText className="w-5 h-5" />, label: 'Quản lý Tài liệu', path: '/admin/files' },
                ...commonItems
            ];
        } else if (userRole === 'teacher') {
            return [
                { icon: <BookOpen className="w-5 h-5" />, label: 'Lớp học', path: '/teacher-dashboard' },
                { icon: <FileText className="w-5 h-5" />, label: 'Bài tập', path: '/assignments' },
                { icon: <MessageSquare className="w-5 h-5" />, label: 'Tin nhắn', path: '/chat' },
                ...commonItems
            ];
        } else {
            return [
                { icon: <BookOpen className="w-5 h-5" />, label: 'Lớp học', path: '/student-dashboard' },
                { icon: <FileText className="w-5 h-5" />, label: 'Bài tập', path: '/assignments' },
                { icon: <MessageSquare className="w-5 h-5" />, label: 'Tin nhắn', path: '/chat' },
                ...commonItems
            ];
        }
    };

    const sidebarItems = getSidebarItems();
    const isChatPage = location.pathname.startsWith('/chat');

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {schoolName || 'SchoolConnect'}
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path || (item.path !== '/teacher-dashboard' && item.path !== '/student-dashboard' && location.pathname.startsWith(item.path))
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center h-20">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {location.pathname.startsWith('/class/')
                            ? 'Chi tiết Lớp học'
                            : (sidebarItems.find(i => location.pathname === i.path || (i.path !== '/teacher-dashboard' && i.path !== '/student-dashboard' && location.pathname.startsWith(i.path)))?.label || 'Bảng điều khiển')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="font-medium text-gray-900">{userData?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                        </div>
                        <Avatar>
                            <AvatarImage src={userData?.avatar_url ? `http://localhost:8000${userData.avatar_url}` : undefined} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={`flex-1 overflow-auto ${isChatPage ? 'p-0' : 'p-8'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
