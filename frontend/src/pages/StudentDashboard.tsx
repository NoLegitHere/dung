import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const classesRes = await api.get('/classes/');
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = async () => {
        if (!classCode.trim()) return;

        setJoining(true);
        try {
            await api.post(`/classes/join?class_code=${classCode}`);
            toast.success('Tham gia lớp học thành công!');
            setShowJoinModal(false);
            setClassCode('');
            fetchData(); // Refresh classes
        } catch (error: any) {
            console.error('Failed to join class', error);
            toast.error(error.response?.data?.detail || 'Tham gia lớp học thất bại');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Đang tải...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Classes Section */}
            <div>
                <div className="flex justify-end items-center mb-6">
                    <Button onClick={() => setShowJoinModal(true)}>
                        Tham gia lớp học
                    </Button>
                </div>

                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Tham gia lớp học</h3>
                            <p className="text-gray-600 mb-4">Nhập mã lớp học được cung cấp bởi giáo viên.</p>
                            <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                placeholder="Mã lớp học (ví dụ: X7Y8Z9)"
                                className="w-full p-2 border rounded mb-4 uppercase"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setShowJoinModal(false)}>Hủy</Button>
                                <Button onClick={handleJoinClass} disabled={joining}>
                                    {joining ? 'Đang xử lý...' : 'Tham gia'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                        <Card key={classItem.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/class/${classItem.id}`)}>
                            <img
                                src={`http://localhost:8000${classItem.image_url}`}
                                alt={classItem.name}
                                className="w-full h-48 object-cover"
                            />
                            <CardContent className="p-4">
                                <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">Lớp học</p>
                            </CardContent>
                        </Card>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">Bạn chưa tham gia lớp học nào.</p>
                            <Button variant="link" onClick={() => setShowJoinModal(true)}>
                                Tham gia ngay
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
