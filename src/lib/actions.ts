"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

// Note: In a real application, you would use a library like `bcryptjs`
// to hash passwords and a database to store user credentials.
// This is a simplified example for demonstration purposes.

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function login(prevState: any, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { message: "Invalid email or password." };
  }
  
  // Simulate database check and JWT creation
  console.log('User logged in:', parsed.data);
  
  redirect('/dashboard');
}


const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function signup(prevState: any, formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    // A real app would provide more specific error messages
    return { message: "Invalid form data." };
  }

  // Simulate user creation in the database
  console.log('User signed up:', parsed.data);
  
  redirect('/dashboard');
}
