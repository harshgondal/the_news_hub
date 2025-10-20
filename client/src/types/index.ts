export interface Article {
  _id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl: string;
  source: string;
  category: string;
  publishedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}

export interface Analysis {
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  keyPoints?: string;
  qa?: Array<{
    question: string;
    type: string;
    answer?: string;
  }>;
}

export interface QA {
  question: string;
  answer: string;
  timestamp: Date;
}

export interface CategoryStats {
  category: string;
  count: number;
}

export interface SourceStats {
  source: string;
  count: number;
}

export interface DateStats {
  date: string;
  count: number;
}

export interface TrendingTopic {
  topic: string;
  count: number;
}

export interface DashboardStats {
  totalArticles: number;
  recentArticles: number;
  categoryStats: CategoryStats[];
  sourceStats: SourceStats[];
  dateStats: DateStats[];
  trendingTopics: TrendingTopic[];
}

export interface Category {
  value: string;
  label: string;
}

export interface Comment {
  _id: string;
  articleId: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  username: string;
  userAvatar?: string;
  content: string;
  parentId?: string | null;
  likes: string[];
  likesCount: number;
  repliesCount: number;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  category: 'sports' | 'general' | 'technology' | 'business' | 'entertainment' | 'politics';
  eventType: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  venue?: string;
  participants?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  source?: string;
  isLive: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags?: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}
