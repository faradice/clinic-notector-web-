import { apiClient } from './config';

export interface GameScore {
  id?: number;
  playerName?: string;
  score: number;
  totalNotes: number;
  correctNotes: number;
  bpm: number;
  repetitions: number;
  playedAt?: string;
}

export const gameApi = {
  getAllScores: async (): Promise<GameScore[]> => {
    const response = await apiClient.get<GameScore[]>('/game/scores');
    return response.data;
  },

  getTopScores: async (): Promise<GameScore[]> => {
    const response = await apiClient.get<GameScore[]>('/game/scores/top');
    return response.data;
  },

  getPlayerScores: async (playerName: string): Promise<GameScore[]> => {
    const response = await apiClient.get<GameScore[]>(`/game/scores/player/${playerName}`);
    return response.data;
  },

  saveScore: async (score: GameScore): Promise<GameScore> => {
    const response = await apiClient.post<GameScore>('/game/scores', score);
    return response.data;
  },

  deleteScore: async (id: number): Promise<void> => {
    await apiClient.delete(`/game/scores/${id}`);
  },
};
