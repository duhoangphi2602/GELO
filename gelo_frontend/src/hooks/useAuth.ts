import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const { token, user, isAuthenticated } = useAuthStore();

  return {
    token,
    user,
    isAuthenticated,
    isAdmin: user.role === 'ADMIN',
    isPatient: user.role === 'PATIENT',
    patientId: user.patientId,
    fullName: user.fullName ?? 'Guest',
    logout: authService.logout,
  };
}
