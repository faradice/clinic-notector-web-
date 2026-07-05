import { apiClient } from './config';

export interface WorkspaceCard {
  id?: number;
  chordId: number;
  chordName: string;
  positionX: number;
  positionY: number;
}

export interface Workspace {
  id?: number;
  name: string;
  description?: string;
  cards: WorkspaceCard[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddCardRequest {
  chordId: number;
  positionX: number;
  positionY: number;
}

export interface UpdatePositionRequest {
  positionX: number;
  positionY: number;
}

export interface CardPositionUpdate {
  cardId: number;
  positionX: number;
  positionY: number;
}

export const workspaceApi = {
  getAll: async (): Promise<Workspace[]> => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    return response.data;
  },

  getById: async (id: number): Promise<Workspace> => {
    const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  create: async (workspace: Partial<Workspace>): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces', workspace);
    return response.data;
  },

  update: async (id: number, workspace: Partial<Workspace>): Promise<Workspace> => {
    const response = await apiClient.put<Workspace>(`/workspaces/${id}`, workspace);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  addCard: async (workspaceId: number, request: AddCardRequest): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>(
      `/workspaces/${workspaceId}/cards`,
      request
    );
    return response.data;
  },

  updateCardPosition: async (
    workspaceId: number,
    cardId: number,
    position: UpdatePositionRequest
  ): Promise<Workspace> => {
    const response = await apiClient.put<Workspace>(
      `/workspaces/${workspaceId}/cards/${cardId}/position`,
      position
    );
    return response.data;
  },

  removeCard: async (workspaceId: number, cardId: number): Promise<Workspace> => {
    const response = await apiClient.delete<Workspace>(
      `/workspaces/${workspaceId}/cards/${cardId}`
    );
    return response.data;
  },

  updateCardPositions: async (
    workspaceId: number,
    updates: CardPositionUpdate[]
  ): Promise<Workspace> => {
    const response = await apiClient.put<Workspace>(
      `/workspaces/${workspaceId}/cards/positions`,
      updates
    );
    return response.data;
  },
};
