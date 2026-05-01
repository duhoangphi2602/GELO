import api from '@/api/axiosClient';
import { useAuthStore } from '@/store/auth.store';

export interface LoginResponse {
  accessToken: string;
  role: 'ADMIN' | 'PATIENT';
  patientId: number | null;
  fullName: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      identifier: identifier.trim(),
      password,
    });

    // Save to centralized store
    useAuthStore.getState().setAuth(data.accessToken, {
      patientId: data.patientId,
      role: data.role,
      fullName: data.fullName,
    });

    return data;
  },

  async forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: any) {
    return api.post('/auth/reset-password', data);
  },

  async register(data: any) {
    return api.post('/auth/register', data);
  },

  async verifyOtp(email: string, code: string, type: 'REGISTER' | 'FORGOT_PASSWORD') {
    return api.post('/auth/verify-otp', { email, code, type });
  },

  async resendOtp(email: string, type: 'REGISTER' | 'FORGOT_PASSWORD') {
    return api.post('/auth/resend-otp', { email, type });
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  async updateProfile(data: any) {
    const { data: response } = await api.patch('/auth/profile', data);
    return response;
  },

  async changePasswordRequest() {
    return api.post('/auth/change-password-request');
  },

  async changePasswordVerify(data: { code: string; newPassword: string }) {
    return api.post('/auth/change-password-verify', data);
  },

  logout() {
    useAuthStore.getState().logout();
    // Clear any other localStorage leftovers from old system
    localStorage.removeItem('accessToken');
    localStorage.removeItem('patientId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('currentScanId');
  },
};
