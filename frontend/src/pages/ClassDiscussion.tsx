import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle } from 'lucide-react';
import api from '../api/axios';

interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
}

interface Answer {
    id: number;
    content: string;
    question_id: number;
    teacher_id: number;
    timestamp: string;
    teacher?: User;
}

interface Question {
    id: number;
    content: string;
    class_id: number;
    student_id: number;
    timestamp: string;
    student?: User;
    answers: Answer[];
}

const ClassDiscussion: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchQuestions();
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [classId]);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/users/me');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await api.get(`/qa/${classId}`);
            setQuestions(response.data);
        } catch (error) {
            console.error('Failed to fetch questions', error);
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Adjust the WebSocket URL to match your backend configuration
        // Assuming backend is on localhost:8000 and proxied or directly accessible
        // Since axios baseURL is http://localhost:8000/api/v1, we can derive it or hardcode for now
        const wsUrl = `${protocol}//localhost:8000/api/v1/qa/ws/${classId}`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Connected to WebSocket');
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };

        ws.current.onclose = () => {
            console.log('Disconnected from WebSocket');
            // Optional: Reconnect logic
        };
    };

    const handleWebSocketMessage = (message: any) => {
        if (message.type === 'new_question') {
            setQuestions(prev => [message.data, ...prev]);
        } else if (message.type === 'new_answer') {
            setQuestions(prev => prev.map(q => {
                if (q.id === message.data.question_id) {
                    return { ...q, answers: [...q.answers, message.data] };
                }
                return q;
            }));
        }
    };

    const handlePostQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        try {
            await api.post('/qa/', {
                content: newQuestion,
                class_id: parseInt(classId || '0'),
            });
            setNewQuestion('');
        } catch (error) {
            console.error('Failed to post question', error);
        }
    };

    const handlePostAnswer = async (questionId: number) => {
        const content = replyContent[questionId];
        if (!content?.trim()) return;

        try {
            await api.post('/qa/answer', {
                content: content,
                question_id: questionId,
            });
            setReplyContent(prev => ({ ...prev, [questionId]: '' }));
        } catch (error) {
            console.error('Failed to post answer', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) return <div className="text-center py-8">Đang tải thảo luận...</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">

            {/* Ask Question Section (Only for Students) */}
            {currentUser?.role === 'student' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Đặt câu hỏi mới
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePostQuestion} className="flex gap-4">
                            <Input
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!newQuestion.trim()}>
                                <Send className="w-4 h-4 mr-2" />
                                Gửi
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
                {questions.map((question) => (
                    <Card key={question.id} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{question.content}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Được hỏi bởi {question.student?.full_name || 'Học sinh'} • {formatDate(question.timestamp)}
                                    </p>
                                </div>
                            </div>

                            {/* Answers */}
                            <div className="space-y-4 pl-6 border-l-2 border-gray-100 ml-2">
                                {question.answers.map((answer) => (
                                    <div key={answer.id} className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-800">{answer.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Trả lời bởi {answer.teacher?.full_name || 'Giáo viên'} • {formatDate(answer.timestamp)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Section (Only for Teachers) */}
                            {currentUser?.role === 'teacher' && (
                                <div className="mt-4 pt-4 border-t flex gap-4">
                                    <Input
                                        value={replyContent[question.id] || ''}
                                        onChange={(e) => setReplyContent(prev => ({ ...prev, [question.id]: e.target.value }))}
                                        placeholder="Viết câu trả lời..."
                                        className="flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handlePostAnswer(question.id)}
                                        disabled={!replyContent[question.id]?.trim()}
                                    >
                                        Trả lời
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassDiscussion;
