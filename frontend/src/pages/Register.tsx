import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../api/axios';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterInput) => {
        try {
            setError('');
            await api.post('/auth/register', {
                email: data.email,
                full_name: data.full_name,
                password: data.password,
                role: selectedRole,
            });

            // Redirect to login after successful registration
            navigate('/');
        } catch (err: any) {
            console.error('Registration failed', err);
            setError(err.response?.data?.detail || 'Đăng ký thất bại');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-gray-900">SchoolConnect</CardTitle>
                        <p className="text-gray-500 mt-2">Tạo tài khoản mới</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Họ và tên
                            </label>
                            <Input
                                {...register('full_name')}
                                type="text"
                                placeholder="Nguyễn Văn A"
                                className="h-11"
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-600 mt-1.5">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Email
                            </label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="your.email@example.com"
                                className="h-11"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600 mt-1.5">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Mật khẩu
                            </label>
                            <Input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                                className="h-11"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-600 mt-1.5">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Xác nhận mật khẩu
                            </label>
                            <Input
                                {...register('confirmPassword')}
                                type="password"
                                placeholder="••••••••"
                                className="h-11"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Vai trò
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={selectedRole === 'student' ? 'default' : 'outline'}
                                    onClick={() => setSelectedRole('student')}
                                    className="h-11"
                                >
                                    Học sinh
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedRole === 'teacher' ? 'default' : 'outline'}
                                    onClick={() => setSelectedRole('teacher')}
                                    className="h-11"
                                >
                                    Giáo viên
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                        </Button>
                    </form>

                    <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Đã có tài khoản?{' '}
                            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
