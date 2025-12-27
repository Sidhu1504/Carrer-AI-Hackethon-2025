import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from 'next/link';

export default function SignupPage() {
  return (
    <AuthShell>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignupForm />
        </CardContent>
      </Card>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
        >
            Login
        </Link>
        .
      </p>
    </AuthShell>
  );
}
