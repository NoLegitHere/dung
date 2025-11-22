import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User>>({});
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        is_active: true
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'is_active' ? value === 'true' : value
        }));
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'student',
            is_active: true
        });
        setCurrentUser({});
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users/', formData);
            setShowAddModal(false);
            resetForm();
            fetchUsers();
            toast.success('Thêm người dùng thành công');
        } catch (error: any) {
            console.error('Failed to add user', error);
            toast.error(error.response?.data?.detail || 'Thêm người dùng thất bại');
        }
    };

    const handleEditClick = (user: User) => {
        setCurrentUser(user);
        setFormData({
            email: user.email,
            password: '', // Don't show password
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active
        });
        setShowEditModal(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            toast.success('Xóa người dùng thành công');
        } catch (error: any) {
            console.error('Failed to delete user', error);
            toast.error(error.response?.data?.detail || 'Xóa người dùng thất bại');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser.id) return;

        try {
            const updateData: any = { ...formData };
            if (!updateData.password) delete updateData.password; // Only send password if changed

            await api.put(`/users/${currentUser.id}`, updateData);
            setShowEditModal(false);
            resetForm();
            fetchUsers();
            toast.success('Cập nhật người dùng thành công');
        } catch (error: any) {
            console.error('Failed to update user', error);
            toast.error(error.response?.data?.detail || 'Cập nhật người dùng thất bại');
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeVariant = (role: string): "default" | "destructive" | "outline" | "secondary" => {
        if (role === 'admin') return 'destructive';
        if (role === 'teacher') return 'default';
        return 'secondary';
    };

    const getRoleLabel = (role: string) => {
        if (role === 'admin') return 'Quản trị';
        if (role === 'teacher') return 'Giáo viên';
        return 'Học sinh';
    };

    const getStatusLabel = (isActive: boolean) => {
        return isActive ? 'Hoạt động' : 'Tạm ngưng';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Người dùng</h1>
                    <p className="text-gray-500 mt-1">Thêm, chỉnh sửa hoặc xóa người dùng trong hệ thống.</p>
                </div>
                <Button className="gap-2" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Plus className="w-4 h-4" />
                    Thêm Người dùng
                </Button>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Thêm Người dùng Mới</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                                <Input name="password" type="password" required value={formData.password} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                                <Input name="full_name" required value={formData.full_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vai trò</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="student">Học sinh</option>
                                    <option value="teacher">Giáo viên</option>
                                    <option value="admin">Quản trị viên</option>
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

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Chỉnh sửa Người dùng</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mật khẩu (Để trống nếu không đổi)</label>
                                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                                <Input name="full_name" required value={formData.full_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vai trò</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="student">Học sinh</option>
                                    <option value="teacher">Giáo viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select
                                    name="is_active"
                                    value={formData.is_active.toString()}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Tạm ngưng</option>
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
                        <CardTitle>Danh sách người dùng</CardTitle>
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc email..."
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
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Vai trò</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.full_name || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {getRoleLabel(user.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                                    {getStatusLabel(user.is_active)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditClick(user)}>
                                                        <Pencil className="w-4 h-4" />
                                                        Chỉnh sửa
                                                    </Button>
                                                    {/* Optional Delete Button */}
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>Xóa</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!loading && filteredUsers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">
                            Không tìm thấy người dùng nào.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;
