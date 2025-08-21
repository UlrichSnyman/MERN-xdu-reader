export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

export interface Work {
  _id: string;
  title: string;
  synopsis?: string;
  coverImage?: string;
  category: 'book' | 'short-story';
  likes: number;
  chapters: Chapter[] | string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  title: string;
  content: string;
  work: Work | string;
  chapterNumber: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  navigation?: {
    previous?: Chapter;
    next?: Chapter;
  };
}

export interface Lore {
  _id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  authorName: string;
  content: string;
  parentContent: string;
  parentType: 'Chapter' | 'Lore';
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  _id: string;
  content: string;
  authorName?: string;
  email?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  isPlaying: boolean;
  speechRate: number;
}

export interface CommentFormData {
  authorName: string;
  content: string;
  parentContent: string;
  parentType: 'Chapter' | 'Lore';
}