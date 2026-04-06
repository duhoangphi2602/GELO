import { Layout } from "../layout/Layout";
import { ProfileForm } from "./ProfileForm";

export function Profile() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">User Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account settings and personal information.</p>
        </div>

        <ProfileForm />
      </div>
    </Layout>
  );
}
