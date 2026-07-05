import { apiClient } from './config';

export interface SongChordPosition {
  id?: number;
  lineNumber: number;
  wordNumber: number;
  chordName: string;
  charOffset: number;
}

export interface Song {
  id?: number;
  name: string;
  lyrics?: string;
  bpm?: number;
  backgroundColor?: string;
  textColor?: string;
  fontName?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  chordPositions?: SongChordPosition[];
  createdAt?: string;
  updatedAt?: string;
}

export const songApi = {
  getAll: async (): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs');
    return response.data;
  },

  getById: async (id: number): Promise<Song> => {
    const response = await apiClient.get<Song>(`/songs/${id}`);
    return response.data;
  },

  getByName: async (name: string): Promise<Song> => {
    const response = await apiClient.get<Song>(`/songs/name/${name}`);
    return response.data;
  },

  create: async (song: Song): Promise<Song> => {
    const response = await apiClient.post<Song>('/songs', song);
    return response.data;
  },

  update: async (id: number, song: Song): Promise<Song> => {
    const response = await apiClient.put<Song>(`/songs/${id}`, song);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/songs/${id}`);
  },
};
