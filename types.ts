export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  isThinking?: boolean;
}

export enum ResolutionCategory {
  HEALTH = 'Health',
  CAREER = 'Career',
  RELATIONSHIPS = 'Relationships',
  GROWTH = 'Personal Growth',
  FINANCE = 'Finance',
  OTHER = 'Other'
}

export interface Resolution {
  id: string;
  title: string;
  category: ResolutionCategory;
  motivation: string;
  firstStep: string;
  createdAt: number;
}

export interface ChartDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}