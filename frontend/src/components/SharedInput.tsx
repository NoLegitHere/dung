import React, { useState } from 'react';

const SharedInput: React.FC<{ userRole: 'teacher' | 'student' }> = ({ userRole }) => {
    const [content, setContent] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // If teacher, broadcast changes via WebSocket
    };

    return (
        <div className="h-full flex flex-col border rounded-lg shadow-md bg-white">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold">
                    {userRole === 'teacher' ? 'Bảng giảng dạy (Giáo viên)' : 'Bảng theo dõi (Học sinh)'}
                </h3>
            </div>
            <textarea
                className="flex-1 w-full p-4 resize-none focus:outline-none"
                value={content}
                onChange={handleChange}
                placeholder={userRole === 'teacher' ? "Nhập nội dung bài giảng..." : "Nội dung bài giảng sẽ xuất hiện ở đây..."}
                readOnly={userRole === 'student'}
            />
        </div>
    );
};

export default SharedInput;
