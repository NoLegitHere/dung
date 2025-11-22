import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface Teacher {
    id: number;
    full_name: string;
    email: string;
}

interface Class {
    id: number;
    name: string;
    teacher_id: number;
    class_code: string;
    image_url?: string;
    teacher?: Teacher;
}

const AdminClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentClass, setCurrentClass] = useState<Partial<Class>>({});
    const [formData, setFormData] = useState({
        name: '',
        teacher_id: 0,
    });

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes/');
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/users/');
            // Filter only teachers
            const teacherUsers = response.data.filter((user: any) => user.role === 'teacher');
            setTeachers(teacherUsers);
        } catch (error) {
            console.error('Failed to fetch teachers', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'teacher_id' ? parseInt(value) : value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            teacher_id: 0,
        });
        setCurrentClass({});
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/classes/', formData);
            setShowAddModal(false);
            resetForm();
            fetchClasses();
            toast.success('Thêm lớp học thành công');
        } catch (error: any) {
            console.error('Failed to add class', error);
            toast.error(error.response?.data?.detail || 'Thêm lớp học thất bại');
        }
    };

    const handleEditClick = (classItem: Class) => {
        setCurrentClass(classItem);
        setFormData({
            name: classItem.name,
            teacher_id: classItem.teacher_id,
        });
        setShowEditModal(true);
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentClass.id) return;

        try {
            await api.put(`/classes/${currentClass.id}`, formData);
            setShowEditModal(false);
            resetForm();
            fetchClasses();
            toast.success('Cập nhật lớp học thành công');
        } catch (error: any) {
            console.error('Failed to update class', error);
            toast.error(error.response?.data?.detail || 'Cập nhật lớp học thất bại');
        }
    };

    const handleDeleteClass = async (classId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;

        try {
            await api.delete(`/classes/${classId}`);
            fetchClasses();
            toast.success('Xóa lớp học thành công');
        } catch (error: any) {
            console.error('Failed to delete class', error);
            toast.error(error.response?.data?.detail || 'Xóa lớp học thất bại');
        }
    };

    const handleRegenerateCode = async (classId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn tạo lại mã lớp học? Mã cũ sẽ không còn hiệu lực.')) return;

        try {
            await api.post(`/classes/${classId}/regenerate-code`);
            fetchClasses();
            toast.success('Tạo lại mã lớp học thành công');
        } catch (error: any) {
            console.error('Failed to regenerate code', error);
            toast.error(error.response?.data?.detail || 'Tạo lại mã thất bại');
        }
    };

    const filteredClasses = classes.filter(classItem =>
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.class_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Lớp học</h1>
                    <p className="text-gray-500 mt-1">Thêm, chỉnh sửa hoặc xóa lớp học trong hệ thống.</p>
                </div>
                <Button className="gap-2" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Plus className="w-4 h-4" />
                    Thêm Lớp học
                </Button>
            </div>

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Thêm Lớp học Mới</h3>
                        <form onSubmit={handleAddClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên lớp học</label>
                                <Input name="name" required value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Giáo viên</label>
                                <select
                                    name="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Chọn giáo viên</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Hủy</Button>
                                <Button type="submit">Thêm</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Class Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Chỉnh sửa Lớp học</h3>
                        <form onSubmit={handleUpdateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên lớp học</label>
                                <Input name="name" required value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Giáo viên</label>
                                <select
                                    name="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Chọn giáo viên</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Hủy</Button>
                                <Button type="submit">Cập nhật</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Danh sách lớp học</CardTitle>
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc mã lớp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-8 text-gray-500">Đang tải...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tên lớp</TableHead>
                                        <TableHead>Mã lớp</TableHead>
                                        <TableHead>Giáo viên</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClasses.map((classItem) => (
                                        <TableRow key={classItem.id}>
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {classItem.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{classItem.class_code}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">
                                                    {classItem.teacher?.full_name || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => handleEditClick(classItem)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Sửa
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => handleRegenerateCode(classItem.id)}
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        Tạo lại mã
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClass(classItem.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!loading && filteredClasses.length === 0 && (
                        <p className="text-center py-8 text-gray-500">
                            Không tìm thấy lớp học nào.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminClassManagement;
