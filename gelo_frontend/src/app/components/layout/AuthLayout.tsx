// src/app/components/layout/AuthLayout.tsx
import React from "react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    description: string;
}

export default function AuthLayout({ children, title, subtitle, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen font-sans bg-white">
            {/* CỘT BÊN TRÁI: Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#2a64ad] text-white p-16 flex-col relative overflow-hidden">
                <div className="z-10 mt-12">
                    <p className="text-sm tracking-widest uppercase mb-4 text-blue-200">
                        Dermatology AI System
                    </p>
                    <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                        Welcome to<br />GELO.
                    </h1>
                    <p className="text-lg text-blue-100 max-w-md mb-12">
                        Clinical precision meets algorithmic insight. Diagnose faster, document smarter, and collaborate with confidence.
                    </p>

                    <div className="w-12 h-1 bg-blue-300 mb-8 opacity-50"></div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-5 h-5 border border-blue-200 rounded text-xs opacity-80">✓</span>
                            <span className="text-blue-100 opacity-90">HIPAA & GDPR Compliant</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-5 h-5 border border-blue-200 rounded text-xs opacity-80">✓</span>
                            <span className="text-blue-100 opacity-90">ISO 13485 Certified System</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-5 h-5 border border-blue-200 rounded text-xs opacity-80">✓</span>
                            <span className="text-blue-100 opacity-90">256-bit Encrypted Data</span>
                        </li>
                    </ul>
                </div>

                {/* Background text */}
                <div className="absolute -bottom-12 -left-4 text-[200px] font-black text-blue-800 opacity-20 select-none">
                    GELO
                </div>
            </div>

            {/* CỘT BÊN PHẢI: Chứa Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-24">
                <div className="max-w-md w-full mx-auto">
                    <p className="text-[#2a64ad] text-sm font-semibold tracking-wider uppercase mb-2">
                        {subtitle}
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        {description}
                    </p>

                    {children}
                </div>
            </div>
        </div>
    );
}