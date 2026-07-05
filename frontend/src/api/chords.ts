import { apiClient } from './config';

export type ChordFretPosition = {
  id?: number;
  stringNumber: number;
  fretNumber: number;
  finger?: number;
  isBase?: boolean;
};;

export type Chord = {
  id?: number;
  name: string;
  rootNote: string;
  chordType: string;
  fretPositions: ChordFretPosition[];
  createdAt?: string;
  updatedAt?: string;
};;

export type ChordAnalysisRequest = {
  fretPositions: ChordFretPosition[];
};

export type ChordAnalysisResponse = {
  name: string;
  rootNote: string;
  chordType: string;
};

export const chordApi = {
  getAll: async (): Promise<Chord[]> => {
    const response = await apiClient.get<Chord[]>('/chords');
    return response.data;
  },

  getById: async (id: number): Promise<Chord> => {
    const response = await apiClient.get<Chord>(`/chords/${id}`);
    return response.data;
  },

  getByName: async (name: string): Promise<Chord> => {
    const response = await apiClient.get<Chord>(`/chords/name/${name}`);
    return response.data;
  },

  create: async (chord: Chord): Promise<Chord> => {
    const response = await apiClient.post<Chord>('/chords', chord);
    return response.data;
  },

  update: async (id: number, chord: Chord): Promise<Chord> => {
    const response = await apiClient.put<Chord>(`/chords/${id}`, chord);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/chords/${id}`);
  },

  analyze: async (fretPositions: ChordFretPosition[]): Promise<ChordAnalysisResponse> => {
    const response = await apiClient.post<ChordAnalysisResponse>('/chords/analyze', {
      fretPositions,
    });
    return response.data;
  },
};;
