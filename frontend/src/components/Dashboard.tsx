import React from 'react';
import SharedInput from './SharedInput';
import QAChat from './QAChat';
import { WebSocketProvider } from '../context/WebSocketContext';

const Dashboard: React.FC<{ role: 'teacher' | 'student' }> = ({ role }) => {
    // Mock class ID for now, in real app this comes from route or selection
    const classId = 1;

    return (
        <WebSocketProvider>
            <div className="flex flex-col h-screen bg-gray-100">
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">SchoolConnect - {role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</h1>
                    <div className="text-sm text-gray-600">Lớp học: 9A1</div>
                </header>

                <main className="flex-1 p-4 flex gap-4 overflow-hidden">
                    <div className="w-2/3 h-full">
                        <SharedInput userRole={role} />
                    </div>
                    <div className="w-1/3 h-full">
                        <QAChat classId={classId} userRole={role} />
                    </div>
                </main>
            </div>
        </WebSocketProvider>
    );
};

export default Dashboard;
