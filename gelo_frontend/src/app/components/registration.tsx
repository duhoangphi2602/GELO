// registration.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertCircle, Eye, EyeOff } from "lucide-react";
import api from "../lib/api";

// Validation helpers
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string) => password.length >= 6;

const validateAge = (age: string) => {
  const n = parseInt(age, 10);
  return !isNaN(n) && n >= 1 && n <= 120;
};

interface FieldErrors {
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
  gender?: string;
  general?: string;
}

export function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Run client-side validation, return errors object
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};

    if (!formData.username.trim()) {
      e.username = "Username is required.";
    } else if (formData.username.trim().length < 3) {
      e.username = "Username must be at least 3 characters.";
    }

    if (!formData.fullName.trim()) {
      e.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      e.email = "Email is required.";
    } else if (!validateEmail(formData.email)) {
      e.email = "Invalid email format (e.g. user@example.com).";
    }

    if (!formData.password) {
      e.password = "Password is required.";
    } else if (!validatePassword(formData.password)) {
      e.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      e.confirmPassword = "Passwords do not match.";
    }

    if (!formData.age) {
      e.age = "Age is required.";
    } else if (!validateAge(formData.age)) {
      e.age = "Age must be between 1 and 120.";
    }

    if (!formData.gender) {
      e.gender = "Please select a gender.";
    }

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");

    // Client-side validation first
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      // Create a copy and remove confirmPassword before sending to backend
      const { confirmPassword, ...rawData } = formData;
      
      // Fix types and enums for backend validation
      const dataToSubmit = {
        ...rawData,
        age: rawData.age ? parseInt(rawData.age, 10) : undefined,
        gender: rawData.gender ? rawData.gender : undefined,
      };

      const response = await api.post(
        "/auth/register",
        dataToSubmit
      );
      if (response.data.patientId) {
        setSuccessMsg("success");
        setTimeout(() => navigate("/"), 2500);
      }
    } catch (error: any) {
      const backendMsg = error.response?.data?.message;
      let newErrors: FieldErrors = {};

      if (Array.isArray(backendMsg)) {
        // Map common backend validation messages to specific fields
        backendMsg.forEach((msg: string) => {
          const m = msg.toLowerCase();
          if (m.includes("username")) newErrors.username = msg;
          else if (m.includes("email")) newErrors.email = msg;
          else if (m.includes("password")) newErrors.password = msg;
          else if (m.includes("age")) newErrors.age = msg;
          else if (m.includes("gender")) newErrors.gender = msg;
          else if (m.includes("full name")) newErrors.fullName = msg;
          else newErrors.general = (newErrors.general ? newErrors.general + ", " : "") + msg;
        });
      } else {
        newErrors.general = "Registration failed: " + (backendMsg || error.message || "Unknown error");
      }

      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  };

  // Reusable field error component
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {msg}
      </p>
    ) : null;

  // ── Màn hình thành công toàn trang ──────────────────────────────────────
  if (successMsg === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-8">
          {/* Animated checkmark circle */}
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

          <h2
            className="text-3xl font-bold text-slate-800 mb-3"
            style={{ animation: "fadeSlideUp 0.5s ease 0.4s both" }}
          >
            Account Created!
          </h2>
          <p
            className="text-slate-500 text-lg mb-2"
            style={{ animation: "fadeSlideUp 0.5s ease 0.55s both" }}
          >
            Your GELO account has been set up successfully.
          </p>
          <p
            className="text-slate-400 text-sm"
            style={{ animation: "fadeSlideUp 0.5s ease 0.65s both" }}
          >
            Redirecting you to login...
          </p>

          {/* Progress bar */}
          <div
            className="mt-8 h-1 w-48 mx-auto rounded-full bg-slate-200 overflow-hidden"
            style={{ animation: "fadeSlideUp 0.5s ease 0.7s both" }}
          >
            <div
              className="h-full bg-[#2a64ad] rounded-full"
              style={{ animation: "progressBar 2.5s linear forwards" }}
            />
          </div>
        </div>

        {/* Keyframe animations injected inline */}
        <style>{`
          @keyframes popIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @keyframes drawCheck {
            from { opacity: 0; transform: scale(0.5); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes progressBar {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ── Form đăng ký ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a64ad] mb-4 shadow-lg shadow-[#2a64ad]/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Create Account
          </h1>
          <p className="text-slate-500">Join the GELO healthcare platform today</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">

          {/* General error banner */}
          {errors.general && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 ${errors.username
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                  }`}
                placeholder="Choose a username (min. 3 chars)"
              />
              <FieldError msg={errors.username} />
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 ${errors.fullName
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                  }`}
                placeholder="Enter your full name"
              />
              <FieldError msg={errors.fullName} />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 ${errors.email
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                  }`}
                placeholder="Enter your email (e.g. user@example.com)"
              />
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 pr-12 ${errors.password
                    ? "border-red-400 focus:ring-red-200"
                    : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                    }`}
                  placeholder="Create a password (min. 6 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 pr-12 ${errors.confirmPassword
                    ? "border-red-400 focus:ring-red-200"
                    : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                    }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword} />
            </div>

            {/* Age */}
            <div>
              <label
                htmlFor="age"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={`cursor-text w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 ${errors.age
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                  }`}
                placeholder="Enter your age (1–120)"
                min="1"
                max="120"
              />
              <FieldError msg={errors.age} />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`cursor-pointer hover:bg-slate-50 transition-colors w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 ${errors.gender
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-200 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad]"
                  }`}
              >
                <option value="" disabled hidden>Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNKNOWN">Prefer not to say</option>
              </select>
              <FieldError msg={errors.gender} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-[#2a64ad] text-white py-3 rounded-xl hover:bg-[#2a64ad] hover:shadow-md transition-all mt-6 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="cursor-pointer text-[#2a64ad] hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
