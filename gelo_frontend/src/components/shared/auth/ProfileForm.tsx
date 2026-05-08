import React, { useState, useEffect, useRef } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, Shield, Loader2, AlertCircle } from "lucide-react";

import { useToastContext } from "@/components/shared/ui/ToastContext";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

interface ProfileData {
  username: string;
  email: string;
  role: 'ADMIN' | 'PATIENT';
  patient?: {
    id: number;
    fullName: string;
    age?: number;
    gender?: string;
  };
}

export function ProfileForm() {
  const toast = useToastContext();
  const setAuth = useAuthStore(state => state.setAuth);
  const token = useAuthStore(state => state.token);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | string>("");
  const [gender, setGender] = useState("");

  const [changePasswordStep, setChangePasswordStep] = useState<"IDLE" | "OTP">("IDLE");
  const [cpOtp, setCpOtp] = useState(["", "", "", "", "", ""]);
  const [cpNewPassword, setCpNewPassword] = useState("");
  const [cpConfirmPassword, setCpConfirmPassword] = useState("");
  const [cpResendTimer, setCpResendTimer] = useState(0);
   const [cpLoading, setCpLoading] = useState(false);
   const [serverError, setServerError] = useState("");
   const errorRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (serverError && errorRef.current) {
       errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   }, [serverError]);

  const cpOtpRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => authService.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email);
      setFullName(profile.patient?.fullName || "");
      setAge(profile.patient?.age || "");
      setGender(profile.patient?.gender || "UNKNOWN");
    }
  }, [profile]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cpResendTimer > 0) {
      interval = setInterval(() => setCpResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cpResendTimer]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => authService.updateProfile(data),
     onSuccess: (updatedProfile: ProfileData) => {
       setServerError("");
       if (token) {

        setAuth(token, {
          patientId: updatedProfile.patient?.id || null,
          role: updatedProfile.role,
          fullName: updatedProfile.patient?.fullName || fullName,
        });
      }
      toast.success("Profile updated!", "Your information has been saved successfully.");
    },
     onError: (err: any) => {
       const msg = err.response?.data?.message || "Something went wrong.";
       setServerError(msg);
       toast.error("Update failed", msg);
     }
   });

   const handleSave = () => {
     setServerError("");
     updateMutation.mutate({

      username,
      fullName,
      email,
      age: age ? Number(age) : undefined,
      gender,
    });
  };

  const handleChangePasswordRequest = async () => {
    setCpLoading(true);
    try {
      await authService.changePasswordRequest();
      setChangePasswordStep("OTP");
      setCpResendTimer(60);
      toast.success("OTP Sent", "Check your email for the verification code.");
    } catch (err: any) {
      toast.error("Failed", err.response?.data?.message || "Could not request OTP.");
    } finally {
      setCpLoading(false);
    }
  };

  const handleCpOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...cpOtp];
    newOtp[index] = value;
    setCpOtp(newOtp);
    if (value !== "" && index < 5) cpOtpRefs[index + 1].current?.focus();
  };

  const handleCpOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && cpOtp[index] === "" && index > 0) cpOtpRefs[index - 1].current?.focus();
  };

  const handleChangePasswordVerify = async () => {
    const code = cpOtp.join("");
    if (code.length < 6 || cpNewPassword.length < 6 || cpNewPassword !== cpConfirmPassword) {
      toast.error("Validation Error", "Please check your inputs.");
      return;
    }

    setCpLoading(true);
    try {
      await authService.changePasswordVerify({ code, newPassword: cpNewPassword });
      toast.success("Success", "Password changed successfully.");
      setChangePasswordStep("IDLE");
      setCpOtp(["", "", "", "", "", ""]);
      setCpNewPassword("");
      setCpConfirmPassword("");
    } catch (err: any) {
      toast.error("Failed", err.response?.data?.message || "Could not change password.");
    } finally {
      setCpLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#2a64ad]" />
      </div>
    );
  }

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "??";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
          <div className="w-24 h-24 bg-blue-100/50 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-md relative z-10">
            <span className="text-3xl font-black text-[#2a64ad] tracking-tighter">{initials}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 relative z-10">{fullName}</h3>
          <p className="text-sm text-slate-500 mb-5 relative z-10">{email}</p>
          <span className="px-4 py-1.5 bg-blue-50 text-[#2a64ad] text-xs font-bold uppercase tracking-wider rounded-lg border border-blue-100/50 relative z-10">Patient Account</span>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 space-y-8">
           <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Personal Information</h3>
           
           <div ref={errorRef}>
             {serverError && (
               <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <span className="text-sm font-medium">{serverError}</span>
               </div>
             )}
           </div>

           <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <div className="relative">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2a64ad]/20 outline-none transition-all text-slate-700 font-medium" />
                <User size={18} className="text-slate-400 absolute left-4 top-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2a64ad]/20 outline-none transition-all text-slate-700 font-medium" />
                <User size={18} className="text-slate-400 absolute left-4 top-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2a64ad]/20 outline-none transition-all text-slate-700 font-medium" />
                <Mail size={18} className="text-slate-400 absolute left-4 top-4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2a64ad]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2a64ad]/20">
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6">
              <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest text-[10px]">Security Settings</h4>
              {changePasswordStep === "IDLE" ? (
                <button onClick={handleChangePasswordRequest} disabled={cpLoading} className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition-all shadow-sm hover:bg-slate-100 cursor-pointer">
                  <Shield size={16} className="text-slate-400" /> {cpLoading ? "Processing..." : "Change Password"}
                </button>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                  <div className="flex gap-2">
                    {cpOtp.map((digit, index) => (
                      <input key={index} ref={cpOtpRefs[index]} type="text" maxLength={1} value={digit} onChange={e => handleCpOtpChange(index, e.target.value)} onKeyDown={e => handleCpOtpKeyDown(index, e)} className="w-10 h-12 text-center text-xl font-bold bg-white border border-slate-300 rounded-lg focus:border-[#2a64ad] outline-none" />
                    ))}
                  </div>
                  <div className="space-y-3">
                    <input type="password" placeholder="New Password" value={cpNewPassword} onChange={e => setCpNewPassword(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                    <input type="password" placeholder="Confirm Password" value={cpConfirmPassword} onChange={e => setCpConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleChangePasswordVerify} disabled={cpLoading} className="px-6 py-2.5 bg-[#2a64ad] text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer">Confirm Change</button>
                    <button onClick={() => setChangePasswordStep("IDLE")} className="text-xs font-bold text-slate-500 uppercase cursor-pointer">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button onClick={handleSave} disabled={updateMutation.isPending} className="px-10 py-3 bg-[#2a64ad] text-white font-black rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
