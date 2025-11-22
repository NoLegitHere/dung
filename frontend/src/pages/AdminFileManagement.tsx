import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Download, Eye, FileText, Image as ImageIcon, File } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface FileItem {
    name: string;
    path: string;
    size: number;
    type: string;
    uploaded_at: string;
}

const AdminFileManagement: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            // For now, we'll simulate file listing from static directory
            // In production, this would call a backend endpoint
            const response = await api.get('/files/');
            setFiles(response.data || []);
        } catch (error) {
            console.error('Failed to fetch files', error);
            // For now, just show empty state
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchFiles();
            toast.success('Tải file lên thành công');
        } catch (error: any) {
            console.error('Failed to upload file', error);
            toast.error(error.response?.data?.detail || 'Tải file lên thất bại');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = async (filePath: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa file này?')) return;

        try {
            await api.delete(`/files/${encodeURIComponent(filePath)}`);
            fetchFiles();
            toast.success('Xóa file thành công');
        } catch (error: any) {
            console.error('Failed to delete file', error);
            toast.error(error.response?.data?.detail || 'Xóa file thất bại');
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || file.type.includes(filterType);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài liệu</h1>
                    <p className="text-gray-500 mt-1">Quản lý tất cả các file được tải lên trong hệ thống.</p>
                </div>
                <div>
                    <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload"
                    />
                    <Button
                        className="gap-2"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploading}
                    >
                        <Plus className="w-4 h-4" />
                        {uploading ? 'Đang tải lên...' : 'Tải lên File'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center gap-4">
                        <CardTitle>Danh sách tài liệu</CardTitle>
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="p-2 border rounded-md"
                            >
                                <option value="all">Tất cả loại</option>
                                <option value="image">Hình ảnh</option>
                                <option value="pdf">PDF</option>
                                <option value="document">Tài liệu</option>
                            </select>
                            <Input
                                placeholder="Tìm kiếm file..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
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
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Tên file</TableHead>
                                        <TableHead>Kích thước</TableHead>
                                        <TableHead>Ngày tải lên</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFiles.length > 0 ? (
                                        filteredFiles.map((file, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {getFileIcon(file.type)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {file.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-500">
                                                        {formatFileSize(file.size)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(file.uploaded_at).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => window.open(`http://localhost:8000${file.path}`, '_blank')}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Xem
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = `http://localhost:8000${file.path}`;
                                                                link.download = file.name;
                                                                link.click();
                                                            }}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Tải xuống
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeleteFile(file.path)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                Không có file nào.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminFileManagement;
