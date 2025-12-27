"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirebaseError } from 'firebase/app';

const { auth, firestore } = initializeFirebase();


const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function signup(prevState: any, formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { message: "Invalid form data. Please check your entries." };
  }

  const { name, email, password } = parsed.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user document in Firestore
    await setDoc(doc(firestore, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: user.email,
      createdAt: serverTimestamp(),
    });

  } catch (e) {
    if (e instanceof FirebaseError) {
      return { message: e.message };
    }
    return { message: "An unknown error occurred. Please try again." };
  }
  
  redirect('/dashboard');
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function login(prevState: any, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { message: "Invalid email or password." };
  }

  const { email, password } = parsed.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
     if (e instanceof FirebaseError) {
      return { message: e.message };
    }
    return { message: "An unknown error occurred. Please try again." };
  }

  redirect('/dashboard');
}
