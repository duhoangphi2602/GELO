import api from '@/api/axiosClient';

export interface Scan {
  id: number;
  patientId: number;
  createdAt: string;
  images: Array<{ imageUrl: string }>;
  diagnosis?: {
    diagnosticStatus: string;
    decision: string;
    aiConfidence: number;
    predictedDisease?: {
      name: string;
    };
  };
}

export const scanService = {
  async getPatientScans(patientId: number): Promise<Scan[]> {
    const { data } = await api.get(`/scans/patient/${patientId}`);
    return data;
  },

  async deleteScan(scanId: number): Promise<void> {
    await api.delete(`/scans/${scanId}`);
  },

  async submitFeedback(scanId: number, isCorrect: boolean, note?: string) {
    return api.post(`/results/${scanId}/feedback`, { isCorrect, note });
  },

  async clearAllHistory(): Promise<void> {
    await api.delete('/scans/history/all');
  },

  async initiateScan(formData: FormData): Promise<{ scanId: number }> {
    const { data } = await api.post('/scans/initiate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45000,
    });
    return data;
  },

  async getResults(scanId: number): Promise<any> {
    const { data } = await api.get(`/results/${scanId}`);
    return data;
  }
};
