import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Slider } from '../components/ui/slider';
import Cropper from 'react-easy-crop';
import { Loader2, Upload, User, Lock, Camera } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface UserProfile {
    id: number;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
}

// Schemas
// ... imports

// Schemas
const profileSchema = z.object({
    full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
});

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    new_password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirm_password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Mật khẩu không khớp",
    path: ["confirm_password"],
});

const Settings: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);

    // Avatar Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Forms
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        fetchUserData();
        fetchDefaultAvatars();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
            profileForm.reset({ full_name: response.data.full_name });
        } catch (error) {
            console.error('Failed to fetch user data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDefaultAvatars = async () => {
        try {
            const response = await api.get('/upload/avatars/defaults');
            setDefaultAvatars(response.data);
        } catch (error) {
            console.error('Failed to fetch default avatars', error);
        }
    };

    const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
        if (!user) return;
        try {
            await api.put(`/users/${user.id}`, data);
            toast.success('Cập nhật hồ sơ thành công');
            fetchUserData();
            window.dispatchEvent(new Event('user-updated'));
        } catch (error) {
            console.error('Failed to update profile', error);
            toast.error('Cập nhật hồ sơ thất bại');
        }
    };

    const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
        if (!user) return;
        try {
            await api.put(`/users/${user.id}`, {
                password: data.new_password
            });
            toast.success('Đổi mật khẩu thành công');
            passwordForm.reset();
        } catch (error) {
            console.error('Failed to update password', error);
            toast.error('Đổi mật khẩu thất bại');
        }
    };

    // Avatar Handling
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
            setIsUploadOpen(true);
        }
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/png');
        });
    };

    const handleUploadCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setUploading(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const formData = new FormData();
            formData.append('file', croppedImageBlob, 'avatar.png');

            await api.post('/upload/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setIsUploadOpen(false);
            setImageSrc(null);
            fetchUserData();
            window.dispatchEvent(new Event('user-updated'));
            toast.success('Cập nhật ảnh đại diện thành công');
        } catch (error) {
            console.error('Failed to upload avatar', error);
            toast.error('Tải ảnh lên thất bại');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectDefaultAvatar = async (url: string) => {
        try {
            await api.post(`/upload/avatar/default?avatar_url=${encodeURIComponent(url)}`);
            fetchUserData();
            window.dispatchEvent(new Event('user-updated'));
            toast.success('Cập nhật ảnh đại diện thành công');
        } catch (error) {
            console.error('Failed to select default avatar', error);
            toast.error('Không thể chọn ảnh đại diện');
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar / Avatar Section */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center">
                            <div className="relative group cursor-pointer" onClick={() => setIsUploadOpen(true)}>
                                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                    <AvatarImage src={user?.avatar_url ? `http://localhost:8000${user.avatar_url}` : undefined} />
                                    <AvatarFallback className="text-4xl">{user?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold">{user?.full_name}</h2>
                            <p className="text-gray-500 capitalize">{user?.role}</p>

                            <div className="mt-6 w-full">
                                <h3 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">Ảnh đại diện mặc định</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {defaultAvatars.map((url, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectDefaultAvatar(url)}
                                            className="relative rounded-full overflow-hidden hover:ring-2 ring-blue-500 transition-all"
                                        >
                                            <img src={`http://localhost:8000${url}`} alt="Avatar" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Settings Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="profile">
                        <TabsList className="mb-6">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="w-4 h-4" /> Hồ sơ
                            </TabsTrigger>
                            <TabsTrigger value="password" className="flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Mật khẩu
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin hồ sơ</CardTitle>
                                    <CardDescription>Cập nhật thông tin cá nhân của bạn.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" value={user?.email} disabled className="bg-gray-100" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Họ và tên</Label>
                                            <Input id="full_name" {...profileForm.register('full_name')} />
                                            {profileForm.formState.errors.full_name && (
                                                <p className="text-red-500 text-sm">{profileForm.formState.errors.full_name.message}</p>
                                            )}
                                        </div>
                                        <Button type="submit">Lưu thay đổi</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="password">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Đổi mật khẩu</CardTitle>
                                    <CardDescription>Đảm bảo tài khoản của bạn sử dụng mật khẩu mạnh để bảo mật.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                                            <Input id="current_password" type="password" {...passwordForm.register('current_password')} />
                                            {passwordForm.formState.errors.current_password && (
                                                <p className="text-red-500 text-sm">{passwordForm.formState.errors.current_password.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password">Mật khẩu mới</Label>
                                            <Input id="new_password" type="password" {...passwordForm.register('new_password')} />
                                            {passwordForm.formState.errors.new_password && (
                                                <p className="text-red-500 text-sm">{passwordForm.formState.errors.new_password.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm_password">Xác nhận mật khẩu</Label>
                                            <Input id="confirm_password" type="password" {...passwordForm.register('confirm_password')} />
                                            {passwordForm.formState.errors.confirm_password && (
                                                <p className="text-red-500 text-sm">{passwordForm.formState.errors.confirm_password.message}</p>
                                            )}
                                        </div>
                                        <Button type="submit">Cập nhật mật khẩu</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Image Upload/Crop Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
                    </DialogHeader>

                    {!imageSrc ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-sm text-gray-500">Nhấn để tải ảnh lên</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={onFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative h-64 w-full bg-black rounded-lg overflow-hidden">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phóng to</Label>
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={(value: React.SetStateAction<number>[]) => setZoom(value[0])}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setImageSrc(null); setIsUploadOpen(false); }}>Hủy</Button>
                                <Button onClick={handleUploadCroppedImage} disabled={uploading}>
                                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Lưu ảnh đại diện
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Settings;
