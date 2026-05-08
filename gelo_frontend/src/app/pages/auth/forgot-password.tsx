import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";

type Step = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

const emailSchema = z.object({
  email: z.string().email("Invalid email format."),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("EMAIL");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const errorRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (serverError && errorRef.current) {
       errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   }, [serverError]);


  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSendEmail = async (data: EmailFormData) => {
    setLoading(true);
    setServerError("");
    try {
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setStep("OTP");
      setResendTimer(60);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) {
      setServerError("Please enter the 6-digit code.");
      return;
    }
    setStep("NEW_PASSWORD");
    setServerError("");
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setServerError("");
    try {
      await authService.forgotPassword(email);
      setResendTimer(60);
      setServerError("A new OTP has been sent to your email.");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: PasswordFormData) => {
    setLoading(true);
    setServerError("");
    try {
      await authService.resetPassword({
        email,
        code: otp.join(""),
        newPassword: data.newPassword,
      });
      setStep("SUCCESS");
      setTimeout(() => navigate("/auth/login"), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to reset password.";
      setServerError(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("code")) {
        setStep("OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "SUCCESS") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#2a64ad] mb-6 shadow-2xl shadow-[#2a64ad]/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Password Reset!</h2>
          <p className="text-slate-500 text-lg mb-2">Your password has been changed successfully.</p>
          <p className="text-slate-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a64ad] mb-4 shadow-lg shadow-[#2a64ad]/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reset Password</h1>
          <p className="text-slate-500">Securely change your account password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
           <div ref={errorRef}>
             {serverError && (
               <div className={`mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm animate-in slide-in-from-top-2 ${serverError.includes("new OTP") ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                 <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                 <span>{serverError}</span>
               </div>
             )}
           </div>


          {step === "EMAIL" && (
            <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Email Address</label>
                <input
                  {...emailForm.register("email")}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${emailForm.formState.errors.email ? "border-red-400" : "border-slate-200"}`}
                  placeholder="Enter your registered email"
                />
                {emailForm.formState.errors.email && <p className="text-xs text-red-600 mt-1">{emailForm.formState.errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#2a64ad] text-white py-3 rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-60">
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {step === "OTP" && (
            <div className="space-y-6 text-center">
              <p className="text-sm text-slate-600 mb-6">Verification code sent to <br /><span className="font-bold text-slate-800">{email}</span></p>
              <div className="flex justify-center gap-2 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}

                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#2a64ad] transition-all"
                  />
                ))}
              </div>
              <button onClick={onVerifyOtp} className="w-full bg-[#2a64ad] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">Continue</button>
              <div className="mt-4 text-sm text-slate-500">
                <button onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className="text-[#2a64ad] font-bold disabled:text-slate-300">
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {step === "NEW_PASSWORD" && (
            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${passwordForm.formState.errors.newPassword ? "border-red-400" : "border-slate-200"}`}
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && <p className="text-xs text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${passwordForm.formState.errors.confirmPassword ? "border-red-400" : "border-slate-200"}`}
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#2a64ad] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <button onClick={() => navigate("/auth/login")} className="flex items-center justify-center w-full gap-2 text-sm font-bold text-slate-500 hover:text-[#2a64ad] transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
