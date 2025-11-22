import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    class_id: number;
}

interface ClassItem {
    id: number;
    name: string;
}

const AssignmentManagement: React.FC = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<Partial<Assignment>>({});
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; assignmentId: number | null }>({
        isOpen: false,
        assignmentId: null,
    });
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        // Get user role from sessionStorage
        const storedRole = sessionStorage.getItem('userRole');
        setUserRole(storedRole || '');
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignmentsRes, classesRes] = await Promise.all([
                api.get('/assignments/'),
                api.get('/classes/'),
            ]);
            setAssignments(assignmentsRes.data);
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentAssignment.id) {
                await api.put(`/assignments/${currentAssignment.id}`, currentAssignment);
            } else {
                await api.post('/assignments/', currentAssignment);
            }
            fetchData();
            setShowForm(false);
            setCurrentAssignment({});
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save assignment', error);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteConfirmation({ isOpen: true, assignmentId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirmation.assignmentId) {
            try {
                await api.delete(`/assignments/${deleteConfirmation.assignmentId}`);
                fetchData();
                setDeleteConfirmation({ isOpen: false, assignmentId: null });
            } catch (error) {
                console.error('Failed to delete assignment', error);
            }
        }
    };

    const startEdit = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        setIsEditing(true);
        setShowForm(true);
    };

    const getClassName = (classId: number) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.name || 'Unknown';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    if (loading) return <div className="text-center py-8">Đang tải...</div>;

    return (
        <div className="space-y-6">
            {!showForm && (userRole === 'teacher' || userRole === 'admin') && (
                <div className="flex justify-end">
                    <Button onClick={() => { setShowForm(true); setIsEditing(false); setCurrentAssignment({}); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Tạo Bài tập
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, assignmentId: null })}>
                                Hủy
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Xóa
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showForm ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditing ? 'Chỉnh sửa Bài tập' : 'Tạo Bài tập Mới'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tiêu đề</label>
                                    <Input
                                        required
                                        value={currentAssignment.title || ''}
                                        onChange={e => setCurrentAssignment({ ...currentAssignment, title: e.target.value })}
                                        placeholder="Nhập tiêu đề bài tập"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Lớp học</label>
                                    <Select
                                        value={currentAssignment.class_id?.toString()}
                                        onValueChange={value => setCurrentAssignment({ ...currentAssignment, class_id: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn lớp học" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mô tả</label>
                                <Textarea
                                    value={currentAssignment.description || ''}
                                    onChange={e => setCurrentAssignment({ ...currentAssignment, description: e.target.value })}
                                    placeholder="Nhập mô tả chi tiết..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ngày đến hạn</label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={currentAssignment.due_date ? new Date(currentAssignment.due_date).toISOString().slice(0, 16) : ''}
                                    onChange={e => setCurrentAssignment({ ...currentAssignment, due_date: new Date(e.target.value).toISOString() })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
                                <Button type="submit">{isEditing ? 'Cập nhật' : 'Tạo mới'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead>Lớp</TableHead>
                                    <TableHead>Ngày đến hạn</TableHead>
                                    {(userRole === 'teacher' || userRole === 'admin') && (
                                        <TableHead className="text-right">Hành động</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((assignment) => (
                                    <TableRow
                                        key={assignment.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                                    >
                                        <TableCell className="font-medium">{assignment.title}</TableCell>
                                        <TableCell>{getClassName(assignment.class_id)}</TableCell>
                                        <TableCell>{formatDate(assignment.due_date)}</TableCell>
                                        {(userRole === 'teacher' || userRole === 'admin') && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" onClick={() => startEdit(assignment)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(assignment.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {assignments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            {userRole === 'student'
                                                ? 'Chưa có bài tập nào được giao cho lớp của bạn.'
                                                : 'Chưa có bài tập nào. Hãy tạo bài tập mới!'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AssignmentManagement;
