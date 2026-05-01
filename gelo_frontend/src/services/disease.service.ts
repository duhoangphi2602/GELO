import api from '@/api/axiosClient';

export interface Disease {
  id: number;
  name: string;
  description?: string;
  symptoms?: string;
  treatment?: string;
}

export const diseaseService = {
  async getSupportedDiseases(): Promise<Disease[]> {
    const { data } = await api.get('/scans/supported-diseases');
    return data;
  },

  async getDisease(id: number): Promise<Disease> {
    const { data } = await api.get(`/diseases/${id}`);
    return data;
  },

  async updateDisease(id: number, data: Partial<Disease>): Promise<Disease> {
    const { data: response } = await api.patch(`/diseases/${id}`, data);
    return response;
  }
};
