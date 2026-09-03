import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(80),
  fullName: z.string().min(2, 'Your name must be at least 2 characters').max(80),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})
export type SignupInput = z.infer<typeof signupSchema>

export const completeSetupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(80),
  fullName: z.string().min(2, 'Your name must be at least 2 characters').max(80),
})
export type CompleteSetupInput = z.infer<typeof completeSetupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
