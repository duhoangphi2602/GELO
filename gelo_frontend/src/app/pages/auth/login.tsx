import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/shared/layout/AuthLayout";

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or username."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
   const [serverError, setServerError] = useState("");
   const errorRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (serverError && errorRef.current) {
       errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   }, [serverError]);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    try {
      const result = await authService.login(data.identifier, data.password);
      if (result.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";
      setServerError(msg);
    }
  };

  return (
    <AuthLayout
      subtitle="AI Skin Analysis"
      title="Sign in to your account"
      description="Enter your email/username and password to access the platform."
    >
       <div ref={errorRef}>
         {serverError && (
           <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center gap-2 animate-in slide-in-from-top-2">
             <svg
               className="w-4 h-4 flex-shrink-0"
               fill="currentColor"
               viewBox="0 0 20 20"
             >
               <path
                 fillRule="evenodd"
                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                 clipRule="evenodd"
               />
             </svg>
             <span>{serverError}</span>
           </div>
         )}
       </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email or Username */}
        <div>
          <label
            htmlFor="identifier"
            className="block text-xs font-semibold text-gray-500 uppercase mb-1"
          >
            Email or Username
          </label>
          <input
            type="text"
            id="identifier"
            {...register("identifier")}
            placeholder="Enter your email or username"
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a64ad] text-gray-900"
          />
          {errors.identifier && (
            <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-gray-500 uppercase mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              {...register("password")}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a64ad] text-gray-900 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => navigate("/auth/forgot-password")}
              className="text-xs font-medium text-[#2a64ad] hover:underline cursor-pointer focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2a64ad] text-white py-3 rounded-md font-medium hover:bg-blue-800 transition duration-200 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/auth/register")}
          className="text-[#2a64ad] font-medium hover:underline cursor-pointer"
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}
export default Login;
