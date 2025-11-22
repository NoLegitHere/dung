import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
    full_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'teacher']),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});

// Q&A schemas
export const questionSchema = z.object({
    content: z.string().min(1, 'Nội dung không được để trống'),
    class_id: z.number(),
});

export const answerSchema = z.object({
    content: z.string().min(1, 'Nội dung không được để trống'),
    question_id: z.number(),
});

// Assignment schemas
export const assignmentSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    description: z.string().optional(),
    due_date: z.string().min(1, 'Ngày đáo hạn không được để trống'),
    class_id: z.number(),
});

// User schemas
export const userSchema = z.object({
    full_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    role: z.enum(['student', 'teacher', 'admin']),
    is_active: z.boolean().optional(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type UserInput = z.infer<typeof userSchema>;
