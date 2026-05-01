import api from '@/api/axiosClient';

export interface DiaryEntry {
  id: number;
  patientId: number;
  scanId: number | null;
  conditionScore: number;
  note: string;
  entryDate: string;
  createdAt: string;
}

export const diaryService = {
  async getPatientDiaries(patientId: number): Promise<DiaryEntry[]> {
    const { data } = await api.get(`/diary/${patientId}`);
    return data;
  },

  async saveEntry(data: {
    patientId: number;
    scanId: number | null;
    conditionScore: number;
    note: string;
    entryDate: string;
  }): Promise<{ diaryId: number }> {
    const { data: response } = await api.post('/diary', data);
    return response;
  },

  async deleteEntry(id: number): Promise<void> {
    await api.delete(`/diary/${id}`);
  },

  async clearAllEntries(): Promise<void> {
    await api.delete('/diary/batch/all');
  }
};
