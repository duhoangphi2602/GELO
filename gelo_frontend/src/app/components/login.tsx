// src/app/ui/login.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import AuthLayout from "../components/layout/AuthLayout";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/auth/login", formData);

      localStorage.setItem("role", response.data.role);
      if (response.data.patientId) {
        localStorage.setItem("patientId", response.data.patientId);
      }
      if (response.data.fullName) {
        localStorage.setItem("fullName", response.data.fullName);
      }

      if (response.data.role === 'admin') {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Login failed! Please check your email and password.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // clear error on typing
  };

  return (
    <AuthLayout
      subtitle="AI Skin Analysis"
      title="Sign in to your account"
      description="Enter your credentials to access the platform."
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="doctor@hospital.com"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a64ad] text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a64ad] text-gray-900"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#2a64ad] text-white py-3 rounded-md font-medium hover:bg-blue-800 transition duration-200 mt-2 cursor-pointer"
        >
          Sign In
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