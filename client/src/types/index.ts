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
  category: 'library' | 'lore';
  likes: number;
  pages: Page[] | string[];
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  _id: string;
  title: string;
  content: string;
  work: Work | string;
  pageNumber: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  navigation?: {
    previous?: Page;
    next?: Page;
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
  parentType: 'Page' | 'Lore';
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
  parentType: 'Page' | 'Lore';
}