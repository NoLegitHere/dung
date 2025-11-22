import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Send, Search, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    timestamp: string;
    is_read: boolean;
}

const Chat: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<User[]>([]);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/users/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };
        fetchUser();
    }, []);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/chat/conversations');
                setConversations(response.data);
            } catch (error) {
                console.error('Failed to fetch conversations', error);
            }
        };
        fetchConversations();
    }, []);

    // Connect to WebSocket
    useEffect(() => {
        if (!currentUser) return;

        const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/ws/${currentUser.id}`);

        ws.onopen = () => {
            console.log('Connected to Chat WebSocket');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
                const message = data.message;
                // Only add if it belongs to the active conversation
                if (activeUser && (message.sender_id === activeUser.id || message.sender_id === currentUser.id)) {
                    setMessages((prev) => [...prev, message]);
                }
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Chat WebSocket');
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [currentUser, activeUser]);

    // Fetch messages when active user changes
    useEffect(() => {
        if (!activeUser) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/chat/${activeUser.id}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error('Failed to fetch messages', error);
            }
        };
        fetchMessages();
    }, [activeUser]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !activeUser || !currentUser) return;

        const messageData = {
            receiver_id: activeUser.id,
            content: newMessage
        };

        socket.send(JSON.stringify(messageData));

        // Optimistic update
        const optimisticMessage: Message = {
            id: Date.now(), // Temporary ID
            sender_id: currentUser.id,
            receiver_id: activeUser.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            is_read: false
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage('');
    };

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input placeholder="Tìm kiếm người dùng..." className="pl-8" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setActiveUser(user)}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${activeUser?.id === user.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                                }`}
                        >
                            <Avatar>
                                <AvatarImage src={user.avatar_url ? `http://localhost:8000${user.avatar_url}` : undefined} />
                                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user.full_name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b flex items-center gap-3 shadow-sm">
                            <Avatar>
                                <AvatarImage src={activeUser.avatar_url ? `http://localhost:8000${activeUser.avatar_url}` : undefined} />
                                <AvatarFallback>{activeUser.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">{activeUser.full_name}</h3>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Trực tuyến
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            {!isMe && (
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={activeUser.avatar_url ? `http://localhost:8000${activeUser.avatar_url}` : undefined} />
                                                    <AvatarFallback>{activeUser.full_name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div
                                                className={`p-3 rounded-2xl px-4 shadow-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-900 rounded-bl-none border'
                                                    }`}
                                            >
                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!newMessage.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <UserIcon className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-medium">Chọn một cuộc hội thoại để bắt đầu trò chuyện</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
