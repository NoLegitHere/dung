import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    class_id: number;
}

interface Submission {
    id: number;
    assignment_id: number;
    content: string;
    file_urls: string[];
    submitted_at: string;
    grade?: number;
    feedback?: string;
}

const AssignmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [content, setContent] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [userRole, setUserRole] = useState<string>('');
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [grade, setGrade] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');

    useEffect(() => {
        const role = sessionStorage.getItem('userRole') || 'student';
        setUserRole(role);
        fetchData(role);
    }, [id]);

    const fetchData = async (role: string = userRole) => {
        try {
            const promises: Promise<any>[] = [api.get(`/assignments/${id}`)];

            if (role === 'teacher') {
                promises.push(api.get(`/submissions/assignment/${id}`));
            } else {
                promises.push(api.get('/submissions/my').catch(() => ({ data: [] })));
            }

            const [assignmentRes, submissionRes] = await Promise.all(promises);

            setAssignment(assignmentRes.data);

            if (role === 'teacher') {
                setAllSubmissions(submissionRes.data);
            } else {
                // Find submission for THIS assignment
                const mySubmission = submissionRes.data.find(
                    (sub: Submission) => sub.assignment_id === parseInt(id!)
                );

                if (mySubmission) {
                    setSubmission(mySubmission);
                    setContent(mySubmission.content || '');
                    setUploadedFiles(
                        (mySubmission.file_urls || []).map((url: string) => ({
                            name: url.split('/').pop() || '',
                            url,
                        }))
                    );
                }
            }
        } catch (error) {
            console.error('Failed to fetch assignment', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/submissions/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                return {
                    name: file.name,
                    url: response.data.url,
                };
            });

            const newFiles = await Promise.all(uploadPromises);
            setUploadedFiles([...uploadedFiles, ...newFiles]);
        } catch (error) {
            console.error('Failed to upload files', error);
            toast.error('Tải tệp lên thất bại');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileDelete = async (fileUrl: string) => {
        try {
            // Delete from backend
            await api.delete(`/submissions/files`, { data: { file_url: fileUrl } });

            // Remove from UI
            setUploadedFiles(uploadedFiles.filter((f) => f.url !== fileUrl));
        } catch (error) {
            console.error('Failed to delete file', error);
            toast.error('Xóa tệp thất bại');
        }
    };

    const handleTurnIn = async () => {
        if (uploadedFiles.length === 0 && !content) {
            toast.error('Vui lòng tải lên ít nhất một tệp hoặc nhập nội dung');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/submissions/', {
                assignment_id: parseInt(id!),
                content,
                file_urls: uploadedFiles.map((f) => f.url),
            });

            toast.success('Nộp bài thành công!');
            fetchData(userRole);
        } catch (error) {
            console.error('Failed to submit', error);
            toast.error('Nộp bài thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGradeSubmit = async () => {
        if (!selectedSubmission) return;
        try {
            await api.put(`/submissions/${selectedSubmission.id}`, {
                grade: parseFloat(grade),
                feedback
            });
            toast.success('Đã chấm điểm thành công');
            fetchData('teacher');
            setSelectedSubmission(null);
        } catch (error) {
            console.error('Failed to grade', error);
            toast.error('Chấm điểm thất bại');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!assignment) {
        return <div className="text-center p-8">Không tìm thấy bài tập</div>;
    }

    // Teacher View
    if (userRole === 'teacher') {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{assignment.title}</CardTitle>
                        <p className="text-gray-500 mt-2">Hạn nộp: {formatDate(assignment.due_date)}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Submission List */}
                            <div className="md:col-span-1 border-r pr-4">
                                <h3 className="font-semibold mb-4">Danh sách nộp bài ({allSubmissions.length})</h3>
                                <div className="space-y-2">
                                    {allSubmissions.map(sub => (
                                        <div
                                            key={sub.id}
                                            onClick={() => {
                                                setSelectedSubmission(sub);
                                                setGrade(sub.grade?.toString() || '');
                                                setFeedback(sub.feedback || '');
                                            }}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedSubmission?.id === sub.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                        >
                                            <div className="font-medium">{(sub as any).student?.full_name || 'Học sinh'}</div>
                                            <div className="text-xs text-gray-500">{formatDate(sub.submitted_at)}</div>
                                            {sub.grade !== null && sub.grade !== undefined && (
                                                <div className="text-xs font-bold text-green-600 mt-1">Điểm: {sub.grade}</div>
                                            )}
                                        </div>
                                    ))}
                                    {allSubmissions.length === 0 && (
                                        <p className="text-gray-500 text-sm">Chưa có bài nộp nào.</p>
                                    )}
                                </div>
                            </div>

                            {/* Grading Area */}
                            <div className="md:col-span-2">
                                {selectedSubmission ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Bài làm của {(selectedSubmission as any).student?.full_name}</h3>
                                            <p className="text-sm text-gray-500 mb-4">Nộp lúc: {formatDate(selectedSubmission.submitted_at)}</p>

                                            {selectedSubmission.content && (
                                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                    <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
                                                </div>
                                            )}

                                            {selectedSubmission.file_urls && selectedSubmission.file_urls.length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    {selectedSubmission.file_urls.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`http://localhost:8000${url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 text-blue-600"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            {url.split('/').pop()}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t pt-6 space-y-4">
                                            <h4 className="font-medium">Chấm điểm & Nhận xét</h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium mb-1">Điểm (0-10)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={grade}
                                                        onChange={(e) => setGrade(e.target.value)}
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <label className="block text-sm font-medium mb-1">Nhận xét</label>
                                                    <Textarea
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                        placeholder="Nhập nhận xét..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button onClick={handleGradeSubmit}>Lưu kết quả</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        Chọn một bài nộp để chấm điểm
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isSubmitted = submission !== null;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
            </Button>

            {/* Assignment Header */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{assignment.title}</CardTitle>
                            <p className="text-gray-500 mt-2">Hạn nộp: {formatDate(assignment.due_date)}</p>
                        </div>
                        {isSubmitted && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Đã nộp</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Your Work */}
            <Card>
                <CardHeader>
                    <CardTitle>Bài làm của bạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Grade and Feedback (if graded) */}
                    {submission?.grade !== null && submission?.grade !== undefined && (
                        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Điểm:</span>
                                <span className="text-2xl font-bold text-blue-600">{submission.grade}/10</span>
                            </div>
                            {submission.feedback && (
                                <div className="pt-2 border-t border-blue-200">
                                    <span className="font-medium text-gray-700">Nhận xét:</span>
                                    <p className="text-gray-600 mt-1">{submission.feedback}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung (Tùy chọn)
                        </label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Nhập nội dung bài làm..."
                            className="min-h-[120px]"
                            disabled={isSubmitted}
                        />
                    </div>

                    {/* File Upload Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tệp đính kèm
                        </label>

                        {!isSubmitted && (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Nhấn để tải tệp lên</p>
                                <p className="text-sm text-gray-400 mt-1">Hỗ trợ nhiều tệp cùng lúc</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                            </div>
                        )}

                        {/* File List */}
                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm text-gray-700">{file.name}</span>
                                        </div>
                                        {!isSubmitted && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleFileDelete(file.url)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {uploading && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang tải...</span>
                            </div>
                        )}
                    </div>

                    {/* Turn In Button */}
                    {!isSubmitted && (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => navigate(-1)}>
                                Hủy
                            </Button>
                            <Button onClick={handleTurnIn} disabled={submitting}>
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Nộp bài
                            </Button>
                        </div>
                    )}

                    {isSubmitted && (
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-green-700 font-medium">
                                Đã nộp vào {formatDate(submission.submitted_at)}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AssignmentDetail;
