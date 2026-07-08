import { apiClient } from './config';

export type CustomBar = {
  id?: number;
  name: string;
  notes: string[];
  createdAt?: string;
};

export const customBarApi = {
  getAll: async (): Promise<CustomBar[]> => {
    const response = await apiClient.get<CustomBar[]>('/custom-bars');
    return response.data;
  },

  create: async (bar: CustomBar): Promise<CustomBar> => {
    const response = await apiClient.post<CustomBar>('/custom-bars', bar);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/custom-bars/${id}`);
  },
};
