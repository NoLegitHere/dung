import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Send } from 'lucide-react';
import api from '../api/axios';

type Message = {
    id?: number;
    content: string;
    senderName: string;
    senderRole: string; // 'teacher' or 'student'
    timestamp: string;
};

const QAChat: React.FC<{ classId: number; userRole: 'teacher' | 'student' }> = ({ classId }) => {
    const { socket, isConnected, connect } = useWebSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        connect(classId);
        fetchMessages();
    }, [classId]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/qa/${classId}`);
            // Transform backend data to frontend model
            const loadedMessages = response.data.map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                senderName: msg.student?.full_name || 'Unknown',
                senderRole: msg.student?.role || 'student',
                timestamp: msg.timestamp
            }));
            setMessages(loadedMessages);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'new_question' || data.type === 'new_answer') {
                    const msg = data.data;
                    const user = data.type === 'new_question' ? msg.student : msg.teacher;
                    const newMsg: Message = {
                        id: msg.id,
                        content: msg.content,
                        senderName: user?.full_name || 'Unknown',
                        senderRole: user?.role || (data.type === 'new_question' ? 'student' : 'teacher'),
                        timestamp: msg.timestamp
                    };
                    setMessages((prev) => [...prev, newMsg]);
                }
            };
        }
    }, [socket]);

    const handleSend = async () => {
        if (newMessage.trim()) {
            try {
                // Both teacher and student can post "questions" (messages) for now
                await api.post('/qa/', { content: newMessage, class_id: classId });
                setNewMessage('');
            } catch (error) {
                console.error("Failed to send message", error);
            }
        }
    };

    return (
        <div className="flex flex-col h-full border rounded-lg shadow-md bg-white">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold">Hỏi đáp (Q&A)</h3>
                <div className="text-sm text-gray-500">
                    {isConnected ? <span className="text-green-500">● Trực tuyến</span> : <span className="text-red-500">● Ngoại tuyến</span>}
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.senderRole === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.senderRole === 'teacher'
                                ? 'bg-blue-100 text-blue-900 rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }`}>
                            <div className="text-xs font-bold mb-1">
                                {msg.senderName} - {msg.senderRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                            </div>
                            <div>{msg.content}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập câu hỏi hoặc câu trả lời..."
                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QAChat;
