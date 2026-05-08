import api from '@/api/axiosClient';

export const adminService = {
  async getPendingReviews(): Promise<any[]> {
    const { data } = await api.get('/admin/pending-reviews');
    return data;
  },

  async getDashboardStats(): Promise<any> {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  async getAdvices(diseaseId: string | number): Promise<any[]> {
    const { data } = await api.get(`/diseases/${diseaseId}/advices`);
    return data;
  },

  async updateAdvices(diseaseId: string | number, advices: any[]): Promise<void> {
    await api.post(`/diseases/${diseaseId}/advices`, advices);
  },


  async getPatients(): Promise<any[]> {
    const { data } = await api.get('/admin/patients');
    return data;
  },

  async getDiseases(): Promise<any[]> {
    const { data } = await api.get('/diseases');
    return data;
  },

  async getVerifiedData(params: any): Promise<any[]> {
    const { data } = await api.get('/admin/verified-data', { params });
    return data;
  },

  async exportCsv(): Promise<Blob> {
    const { data } = await api.get('/admin/export-csv', { responseType: 'blob' });
    return data;
  },

  async createDisease(data: any): Promise<void> {
    await api.post('/diseases', data);
  },

  async updateDisease(id: number, data: any): Promise<void> {
    await api.patch(`/diseases/${id}`, data);
  },

  async deleteDisease(id: number): Promise<void> {
    await api.delete(`/diseases/${id}`);
  },

  async deletePatient(id: number): Promise<void> {
    await api.delete(`/admin/patients/${id}`);
  },

  async reviewScan(scanId: number, data: any): Promise<void> {
    await api.post(`/admin/review/${scanId}`, data);
  },
  
  async deleteScan(scanId: number): Promise<void> {
    await api.delete(`/admin/scan/${scanId}`);
  },

  async bulkDeleteScans(scanIds: number[]): Promise<void> {
    await api.post('/admin/scans/bulk-delete', { scanIds });
  },
};
