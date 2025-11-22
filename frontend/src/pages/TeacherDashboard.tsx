import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface ClassCard {
    id: number;
    name: string;
    image_url: string;
    class_code: string;
}

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        try {
            const response = await api.post('/classes/', { name: newClassName });
            setClasses(prev => [...prev, response.data]);
            setShowCreateModal(false);
            setNewClassName('');
            toast.success('Tạo lớp học thành công');
        } catch (error) {
            console.error('Failed to create class', error);
            toast.error('Tạo lớp học thất bại');
        }
    };

    const fetchData = async () => {
        try {
            const classesRes = await api.get('/classes/');
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            toast.success('Đã sao chép mã lớp vào clipboard');
        } catch (error) {
            console.error('Failed to copy code', error);
            toast.error('Không thể sao chép mã lớp');
        }
    };

    const handleRegenerateCode = async (e: React.MouseEvent, classId: number) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn tạo mã mới cho lớp này không? Mã cũ sẽ không còn hiệu lực.')) return;

        try {
            const response = await api.post(`/classes/${classId}/regenerate-code`);
            const newCode = response.data.class_code;
            setClasses(prev => prev.map(c => c.id === classId ? { ...c, class_code: newCode } : c));
            toast.success(`Mã lớp mới: ${newCode}`);
        } catch (error) {
            console.error('Failed to regenerate code', error);
            toast.error('Không thể tạo mã mới');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Đang tải...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Class Cards Section */}
            <div>
                <div className="flex justify-end items-center mb-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo Lớp học
                    </Button>
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Tạo Lớp học Mới</h3>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tên lớp học</label>
                                    <Input
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        placeholder="Nhập tên lớp học..."
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                                    <Button type="submit">Tạo</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                        <Card key={classItem.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                            <img
                                src={`http://localhost:8000${classItem.image_url}`}
                                alt={classItem.name}
                                className="w-full h-48 object-cover"
                            />
                            <CardContent className="p-4">
                                <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">Lớp học</p>
                                <div className="flex items-center justify-between mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <button
                                        onClick={(e) => handleCopyCode(e, classItem.class_code)}
                                        className="flex items-center gap-2 text-sm font-mono font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {classItem.class_code}
                                    </button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-blue-300 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-400"
                                        onClick={(e) => handleRegenerateCode(e, classItem.id)}
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Đổi mã
                                    </Button>
                                </div>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/class/${classItem.id}`);
                                    }}
                                >
                                    Thảo luận
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
