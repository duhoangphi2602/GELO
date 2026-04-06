import { User, Mail, Shield } from "lucide-react";
import { useState } from "react";

export function ProfileForm() {
  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "John Doe");
  const [email] = useState("john@example.com"); // Static for now based on user context

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSave = () => {
    localStorage.setItem("fullName", fullName);
    alert("Profile updated successfully!");
    // Requires page refresh to update sidebar/header, or could use context in an actual app.
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* User info card */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
          
          <div className="w-24 h-24 bg-emerald-100/50 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-md relative z-10">
            <span className="text-3xl font-black text-emerald-600 tracking-tighter">{initials}</span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 relative z-10">{fullName}</h3>
          <p className="text-sm text-slate-500 mb-5 relative z-10">{email}</p>
          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-100/50 relative z-10">
            Patient Account
          </span>
        </div>
      </div>

      {/* Editable form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 space-y-8">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Personal Information</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium" 
                />
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  defaultValue={email} 
                  readOnly
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none text-slate-500 font-medium cursor-not-allowed" 
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password (optional)</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Leave blank to keep current password" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 placeholder-slate-400" 
                />
                <Shield className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
             <button 
               onClick={handleSave}
               className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-500/20"
             >
               Save Changes
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
