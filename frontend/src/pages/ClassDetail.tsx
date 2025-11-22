import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ClassDiscussion from './ClassDiscussion';
import api from '../api/axios';

interface Grade {
    subject: string;
    score: number;
}

interface Progress {
    subject: string;
    percentage: number;
}

const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (classId) {
            fetchData();
        }
    }, [classId]);

    const fetchData = async () => {
        try {
            // In a real app, these would be filtered by classId
            // For now, we'll fetch "me" endpoints which might return all or filtered data
            // We will implement these endpoints in the backend next
            const [gradesRes, progressRes] = await Promise.all([
                api.get('/grades/me'),
                api.get('/progress/me')
            ]);
            setGrades(gradesRes.data);
            setProgress(progressRes.data);
        } catch (error) {
            console.error('Failed to fetch class details', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Thảo luận Lớp học</h1>
                    <p className="text-gray-500">Hỏi đáp và trao đổi giữa giáo viên và học sinh</p>
                </div>
            </div>

            <Tabs defaultValue="discussion" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
                    <TabsTrigger value="progress">Tiến độ học tập</TabsTrigger>
                    <TabsTrigger value="grades">Điểm số</TabsTrigger>
                </TabsList>

                <TabsContent value="discussion">
                    <ClassDiscussion />
                </TabsContent>

                <TabsContent value="progress">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tiến độ học tập</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <p>Đang tải...</p>
                            ) : progress.length > 0 ? (
                                progress.map((item, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">{item.subject}</span>
                                            <span className="text-sm text-gray-500">{item.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Chưa có dữ liệu tiến độ.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="grades">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bảng điểm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p>Đang tải...</p>
                            ) : grades.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Môn học</th>
                                                <th className="px-6 py-3">Điểm số</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.map((grade, index) => (
                                                <tr key={index} className="bg-white border-b">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{grade.subject}</td>
                                                    <td className="px-6 py-4">{grade.score}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">Chưa có dữ liệu điểm số.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClassDetail;
