import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import api from "@/lib/api";
import { COMPANY_LOGO_SRC } from "@/utils/companyLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    phoneNumber: z.string().min(10, "Invalid phone number"),
    dob: z.string().min(1, "Date of birth is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"verify" | "newPassword">(
    "verify",
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotDob, setForgotDob] = useState("");
  const [forgotUserId, setForgotUserId] = useState<string | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Prevent duplicate requests
  const [requestInProgress, setRequestInProgress] = useState(false);

  const openForgot = () => {
    setForgotEmail(email.trim());
    setForgotDob("");
    setForgotUserId(null);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotStep("verify");
    setForgotOpen(true);
  };

  const verifyDobAndContinue = async () => {
    const targetEmail = forgotEmail.trim();
    if (!targetEmail) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }
    if (!forgotDob) {
      toast({
        title: "Error",
        description: "Please enter your date of birth",
        variant: "destructive",
      });
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api<{ success?: boolean; userId?: string }>(
        "/auth/verify-user",
        {
          method: "POST",
          body: JSON.stringify({ email: targetEmail, dob: forgotDob }),
        },
      );
      if (!response?.userId) {
        throw new Error("Invalid details");
      }
      setForgotUserId(response.userId);
      setForgotStep("newPassword");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: "Failed",
        description: error.message || "Invalid details",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const submitNewPassword = async () => {
    const userId = forgotUserId;
    const newPassword = forgotNewPassword;
    const confirm = forgotConfirmPassword;

    if (!userId) {
      toast({
        title: "Error",
        description: "Please verify your details first",
        variant: "destructive",
      });
      setForgotStep("verify");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    setForgotLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId, newPassword }),
      });
      toast({ title: "Success", description: "Password updated. Please login." });
      setForgotOpen(false);
      setPassword("");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const msg = error.message;
      toast({ title: "Failed", description: msg || "Failed to reset password", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate requests
    if (requestInProgress || isLoading) return;

    setErrors({});

    try {
      loginSchema.parse({ email, password });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      // Handle non-ZodError (e.g., API errors)
      const error = err instanceof Error ? err : new Error(String(err));
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setRequestInProgress(true);

    try {
      const response = await api<{
        token: string;
        user: { id: string; email: string; fullName: string; role: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Only proceed if we have valid response with token and user
      if (response.token && response.user) {
        login(response.token, response.user);

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });

        // Clear intended route
        sessionStorage.removeItem("intendedRoute");

        // Role-based redirect: admin → /admin, user → / (home page)
        const userRole = response.user.role?.toLowerCase();
        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRequestInProgress(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate requests
    if (requestInProgress || isLoading) return;

    setErrors({});

    try {
      signupSchema.parse({
        fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        dob,
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      // Handle non-ZodError (e.g., API errors)
      const error = err instanceof Error ? err : new Error(String(err));
      const errorMessage = error.message === "Invalid request data" ? "Invalid signup details" : error.message;
      toast({ title: "Sign Up Failed", description: errorMessage, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setRequestInProgress(true);

    try {
      const response = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phoneNumber,
          dob,
        }),
      });

      // Persist registration details for autofill in account profile
      try {
        localStorage.setItem(
          `mc_user_profile_${email}`,
          JSON.stringify({
            fullName,
            email,
            phone: phoneNumber,
            dob,
          }),
        );
      } catch {
        // ignore
      }

      toast({
        title: "Account Created!",
        description: "You can now login with your credentials.",
      });

      // Clear form and switch to login
      resetForm();
      setIsLogin(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const errorMessage =
        error.message === "Invalid request data"
          ? "Invalid signup details"
          : error.message;

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRequestInProgress(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhoneNumber("");
    setDob("");
    setErrors({});
    setRequestInProgress(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Top Wave */}
          <div className="relative h-32 overflow-hidden">
            <svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="absolute top-0 left-0 w-full h-full"
            >
              <defs>
                <linearGradient
                  id="waveGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" />
                  <stop offset="100%" stopColor="hsl(199 89% 48%)" />
                </linearGradient>
              </defs>
              <path
                d="M0,0 L0,100 Q125,150 250,100 T500,100 L500,0 Z"
                fill="url(#waveGradient)"
              />
            </svg>

            {/* Logo */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
              <img
                src={COMPANY_LOGO_SRC}
                alt="Mobile Care Logo"
                className="w-14 sm:w-16 mx-auto mb-2 object-contain"
              />
              <h1 className="text-xl font-bold text-black">
                Mobile<span className="text-blue-400"> Care</span>
              </h1>
              <p className="text-black/80 text-xs">
                Your Trusted Repair Partner
              </p>
            </div>
          </div>

          {/* Tab Headers */}
          <div className="flex border-b">
            <button
              onClick={() => {
                setIsLogin(true);
                resetForm();
              }}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${
                isLogin
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                resetForm();
              }}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${
                !isLogin
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-muted"
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-muted"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      {errors.password && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={openForgot}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || requestInProgress}
                      className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-border"></div>
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>

                    {/* Google OAuth Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-full bg-white border-border hover:bg-white hover:text-gray-700 transition-all duration-200"
                      onClick={() => {
                        // Mock Google OAuth - in real app, integrate with Google OAuth
                        toast({
                          title: "Google Login",
                          description:
                            "Google OAuth integration would be implemented here.",
                        });
                      }}
                    >
                      <svg
                        className="w-5 h-5 mr-3 transition-all duration-200"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleEmailSignup}
                  className="space-y-4"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 border-muted"
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-12 border-muted"
                    />
                    {errors.phoneNumber && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-12 border-muted"
                    />
                    {errors.dob && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.dob}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-muted"
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-muted"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || requestInProgress}
                    className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* Google OAuth Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-full bg-white border-border hover:bg-white hover:text-gray-700 transition-all duration-200"
                    onClick={() => {
                      // Mock Google OAuth - in real app, integrate with Google OAuth
                      toast({
                        title: "Google Sign Up",
                        description:
                          "Google OAuth integration would be implemented here.",
                      });
                    }}
                  >
                    <svg
                      className="w-5 h-5 mr-3 transition-all duration-200"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Wave */}
          <div className="relative h-24 overflow-hidden">
            <svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="absolute bottom-0 left-0 w-full h-full"
            >
              <defs>
                <linearGradient
                  id="bottomWaveGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="white" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 L0,80 Q125,30 250,80 T500,80 L500,150 Z"
                fill="url(#bottomWaveGradient)"
              />
            </svg>
          </div>

          {/* Toggle Text */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-black text-sm">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }}
                className="font-bold hover:underline uppercase"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              {forgotStep === "verify"
                ? "Enter your email and date of birth to reset password."
                : "Enter a new password."}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === "verify" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgotDob">Date of Birth</Label>
                <Input
                  id="forgotDob"
                  type="date"
                  value={forgotDob}
                  onChange={(e) => setForgotDob(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {forgotStep === "newPassword" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="forgotNewPassword">New Password</Label>
                <Input
                  id="forgotNewPassword"
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgotConfirmPassword">Confirm Password</Label>
                <Input
                  id="forgotConfirmPassword"
                  type="password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {forgotStep === "verify" ? (
              <Button
                type="button"
                onClick={verifyDobAndContinue}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Checking..." : "Continue"}
              </Button>
            ) : null}
            {forgotStep === "newPassword" ? (
              <Button type="button" onClick={submitNewPassword} disabled={forgotLoading}>
                {forgotLoading ? "Saving..." : "Save Password"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
