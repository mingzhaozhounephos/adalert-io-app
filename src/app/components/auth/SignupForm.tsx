"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  EnvelopeClosedIcon,
  LockClosedIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Header } from "@/components/layout/header";
import { CheckCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const signupFormSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const {
    signUp,
    signInWithGoogle,
    loading,
    sendVerificationEmail,
    setRouter,
  } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Set router instance in auth store
  useEffect(() => {
    setRouter(router);
  }, [router, setRouter]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password, data.fullName);
      setShowVerificationMessage(true);
      toast.success(
        "Account created! Please check your email to verify your account."
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success("Signed in with Google successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    try {
      setIsLoading(true);
      await sendVerificationEmail();
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  }

  if (showVerificationMessage) {
    return (
      <div className="flex min-h-[600px] h-full">
        <div className="w-1/2 flex flex-col h-full justify-center">
          <Header />
          <div className="flex-1 p-8 flex flex-col justify-center h-full">
            <Card className="w-full h-full flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">
                  Verify your email
                </CardTitle>
                <CardDescription>
                  We've sent a verification email to your inbox. Please check
                  your email and click the verification link to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center space-y-4">
                <p className="text-gray-600">
                  Didn't receive the email? Check your spam folder or click the
                  button below to resend.
                </p>
                <Button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Resend verification email"}
                </Button>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already verified?{" "}
                    <Button
                      variant="link"
                      onClick={onSwitchToLogin}
                      className="px-0 font-normal"
                      disabled={isLoading}
                    >
                      Sign in
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Keep the right panel with feature boxes */}
        <div className="w-1/2 h-full hidden lg:block relative">
          <div className="absolute inset-0 w-full h-full bg-[url('/images/adAlert-sign-up-right.jpeg')] bg-cover bg-center" />
          <div className="absolute inset-0 flex flex-col gap-8 justify-center items-center px-8">
            {/* Feature Box 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
              <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
              <div className="text-gray-800 font-medium">
                Negative trends detection with dozens of daily audit points
              </div>
            </div>
            {/* Feature Box 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
              <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
              <div className="text-gray-800 font-medium">
                Policy violation monitoring and budget pacing alerts
              </div>
            </div>
            {/* Feature Box 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
              <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
              <div className="text-gray-800 font-medium">
                Sudden KPI drops detection, landing page uptime and ad serving
                alerts
              </div>
            </div>
            {/* Feature Box 4 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
              <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
              <div className="text-gray-800 font-medium">
                Tap into industry leading PPC ad review strategies
              </div>
            </div>
            {/* Feature Box 5 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
              <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
              <div className="text-gray-800 font-medium">
                Zero management time with only 30 seconds sign up process
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[600px] h-full">
      {/* Left Panel - Signup Form */}
      <div className="w-1/2 flex flex-col h-full justify-center">
        <Header />
        <div className="flex-1 p-8 flex flex-col justify-center h-full">
          <Card className="w-full h-full flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Create your account
              </CardTitle>
              <CardDescription>
                Join AdAlert to start monitoring your ads and get real-time
                alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <Button
                type="button"
                variant="secondary"
                className="w-full flex items-center justify-center py-6 gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xl font-medium mb-6 border border-gray-200 shadow-none"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <span className="mr-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M23.52 12.2728C23.52 11.4219 23.4436 10.6037 23.3018 9.81824H12V14.4601H18.4582C18.18 15.9601 17.3345 17.231 16.0636 18.0819V21.0928H19.9418C22.2109 19.0037 23.52 15.9273 23.52 12.2728Z"
                      fill="#4285F4"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 24C15.24 24 17.9564 22.9255 19.9418 21.0928L16.0636 18.0818C14.9891 18.8018 13.6145 19.2273 12 19.2273C8.87455 19.2273 6.22909 17.1164 5.28546 14.28H1.27637V17.3891C3.25091 21.3109 7.30909 24 12 24Z"
                      fill="#34A853"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.28545 14.2801C5.04545 13.5601 4.90909 12.791 4.90909 12.0001C4.90909 11.2091 5.04545 10.4401 5.28545 9.72005V6.61096H1.27636C0.463636 8.23096 0 10.0637 0 12.0001C0 13.9364 0.463636 15.7691 1.27636 17.3891L5.28545 14.2801Z"
                      fill="#FBBC05"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 4.77273C13.7618 4.77273 15.3436 5.37818 16.5873 6.56727L20.0291 3.12545C17.9509 1.18909 15.2345 0 12 0C7.30909 0 3.25091 2.68909 1.27637 6.61091L5.28546 9.72C6.22909 6.88364 8.87455 4.77273 12 4.77273Z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
                Continue with Google
              </Button>

              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="mx-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PersonIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Enter your full name"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <EnvelopeClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type="password"
                              placeholder="Create a password"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    onClick={onSwitchToLogin}
                    className="px-0 font-normal"
                    disabled={isLoading}
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Background Image with Feature Boxes */}
      <div className="w-1/2 h-full hidden lg:block relative">
        <div className="absolute inset-0 w-full h-full bg-[url('/images/adAlert-sign-up-right.jpeg')] bg-cover bg-center" />
        <div className="absolute inset-0 flex flex-col gap-8 justify-center items-center px-8">
          {/* Feature Box 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
            <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
            <div className="text-gray-800 font-medium">
              Negative trends detection with dozens of daily audit points
            </div>
          </div>
          {/* Feature Box 2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
            <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
            <div className="text-gray-800 font-medium">
              Policy violation monitoring and budget pacing alerts
            </div>
          </div>
          {/* Feature Box 3 */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
            <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
            <div className="text-gray-800 font-medium">
              Sudden KPI drops detection, landing page uptime and ad serving
              alerts
            </div>
          </div>
          {/* Feature Box 4 */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
            <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
            <div className="text-gray-800 font-medium">
              Tap into industry leading PPC ad review strategies
            </div>
          </div>
          {/* Feature Box 5 */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 w-[340px]">
            <CheckCircle className="text-yellow-400 w-8 h-8 flex-shrink-0 mt-1" />
            <div className="text-gray-800 font-medium">
              Zero management time with only 30 seconds sign up process
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
