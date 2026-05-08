import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
  age: z.string().refine((val) => {
    const n = parseInt(val, 10);
    return !isNaN(n) && n >= 1 && n <= 120;
  }, "Age must be between 1 and 120."),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"], {
    message: "Please select a gender.",
  }),


}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Registration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [serverError, setServerError] = useState("");
   const errorRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (serverError && errorRef.current) {
       errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   }, [serverError]);


  // OTP State
  const [step, setStep] = useState<"REGISTER" | "OTP">("REGISTER");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onRegister = async (data: RegisterFormData) => {
    setServerError("");
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSubmit } = data;
      const response = await authService.register({
        ...dataToSubmit,
        age: parseInt(dataToSubmit.age, 10),
      });
      
      if (response.data.patientId) {
        setRegisteredEmail(dataToSubmit.email);
        setStep("OTP");
        setResendTimer(60);
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setServerError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setServerError("");
    try {
      await authService.verifyOtp(registeredEmail, code, "REGISTER");
      setSuccessMsg("success");
      setTimeout(() => navigate("/auth/login"), 2500);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setServerError("");
    try {
      await authService.resendOtp(registeredEmail, "REGISTER");
      setResendTimer(60);
      setServerError("A new OTP has been sent to your email."); // show as info
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (successMsg === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#2a64ad] mb-6 shadow-2xl shadow-[#2a64ad]/30"
            style={{ animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both" }}
          >
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              style={{ animation: "drawCheck 0.4s ease 0.3s both" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3" style={{ animation: "fadeSlideUp 0.5s ease 0.4s both" }}>
            Account Created!
          </h2>
          <p className="text-slate-500 text-lg mb-2" style={{ animation: "fadeSlideUp 0.5s ease 0.55s both" }}>
            Your GELO account has been set up successfully.
          </p>
          <p className="text-slate-400 text-sm" style={{ animation: "fadeSlideUp 0.5s ease 0.65s both" }}>
            Redirecting you to login...
          </p>
          <div className="mt-8 h-1 w-48 mx-auto rounded-full bg-slate-200 overflow-hidden" style={{ animation: "fadeSlideUp 0.5s ease 0.7s both" }}>
            <div className="h-full bg-[#2a64ad] rounded-full" style={{ animation: "progressBar 2.5s linear forwards" }} />
          </div>
        </div>
        <style>{`
          @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes drawCheck { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
        `}</style>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-500">
            {step === "REGISTER" ? "Join the GELO healthcare platform today" : "Verify your email address"}
          </p>
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


          {step === "REGISTER" ? (
            <form onSubmit={handleSubmit(onRegister)} className="space-y-5" noValidate>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Username *</label>
                <input
                  {...register("username")}
                  className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.username ? "border-red-400" : "border-slate-200"}`}
                  placeholder="Choose a username"
                />
                {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Name *</label>
                <input
                  {...register("fullName")}
                  className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.fullName ? "border-red-400" : "border-slate-200"}`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Email *</label>
                <input
                  {...register("email")}
                  className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.email ? "border-red-400" : "border-slate-200"}`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.password ? "border-red-400" : "border-slate-200"}`}
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.confirmPassword ? "border-red-400" : "border-slate-200"}`}
                    placeholder="Confirm your password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Age *</label>
                  <input
                    type="number"
                    {...register("age")}
                    className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.age ? "border-red-400" : "border-slate-200"}`}
                    placeholder="1-120"
                  />
                  {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Gender *</label>
                  <select
                    {...register("gender")}
                    className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none transition-all ${errors.gender ? "border-red-400" : "border-slate-200"}`}
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="UNKNOWN">N/A</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-[#2a64ad] text-white py-3 rounded-xl hover:shadow-lg transition-all mt-4 font-bold disabled:opacity-60"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>

              <p className="text-center text-slate-500 text-sm mt-4">
                Already have an account? <button type="button" onClick={() => navigate("/auth/login")} className="text-[#2a64ad] font-bold">Sign In</button>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-6">
                  Verify your account with the code sent to <br />
                  <span className="font-bold text-slate-800">{registeredEmail}</span>
                </p>

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

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-[#2a64ad] text-white py-3 rounded-xl font-bold disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="mt-4 text-sm text-slate-500">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="text-[#2a64ad] font-bold disabled:text-slate-300"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Registration;
