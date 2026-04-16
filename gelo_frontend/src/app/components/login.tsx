// src/app/components/login.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../lib/api";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";

export function Login() {
  const navigate = useNavigate();

  // 'identifier' có thể là email hoặc username
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!formData.identifier.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response.data.patientId) {
        localStorage.setItem("patientId", response.data.patientId);
      }
      if (response.data.fullName) {
        localStorage.setItem("fullName", response.data.fullName);
      }

      if (response.data.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AuthLayout
      subtitle="AI Skin Analysis"
      title="Sign in to your account"
      description="Enter your email/username and password to access the platform."
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center gap-2">
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
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Enter your email or username"
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a64ad] text-gray-900"
          />
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
              name="password"
              value={formData.password}
              onChange={handleChange}
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2a64ad] text-white py-3 rounded-md font-medium hover:bg-blue-800 transition duration-200 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/register")}
          className="text-[#2a64ad] font-medium hover:underline cursor-pointer"
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}