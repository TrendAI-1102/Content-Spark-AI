export enum View {
  GENERATOR = 'GENERATOR',
  TRENDS = 'TRENDS',
  MODERATION = 'MODERATION',
  ANALYTICS = 'ANALYTICS',
  HISTORY = 'HISTORY',
}

export enum Tone {
  PROVOCATIVE = 'Provocative',
  DEBATE = 'Debate',
  SATIRE = 'Satire',
  PLAYFUL = 'Playful',
  ANALYTICAL = 'Analytical',
  NEUTRAL = 'Neutral',
}

export enum ImageStyle {
  EDITORIAL_VECTOR = 'Editorial vector art',
  MEME = 'Meme-style (no faces)',
  ILLUSTRATION = 'Stylized illustration',
  INFOGRAPHIC = 'Infographic snippet',
}

export enum SafetyStatus {
  SAFE = 'Safe',
  NEEDS_REVIEW = 'Needs Review',
  REJECTED = 'Rejected',
}

export enum ContentType {
  SOCIAL_POST = 'SOCIAL_POST',
  QUOTE = 'QUOTE',
  ILLUSTRATED_TEXT = 'ILLUSTRATED_TEXT',
}

export enum QuoteCategory {
  TRENDING = 'TRENDING',
  PHILOSOPHY = 'PHILOSOPHY',
  LOVE = 'LOVE',
  CONTRARIAN = 'CONTRARIAN',
  MOTIVATION = 'MOTIVATION',
  CELEBRITY = 'CELEBRITY',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum AccentColor {
  INDIGO = 'indigo',
  GREEN = 'green',
  PURPLE = 'purple',
}

export interface ThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
}


export interface GeneratedPostContent {
  hook: string;
  context: string;
  discussion_prompts: string[];
  hashtags: string[];
  safety_tag: SafetyStatus;
  disclaimer?: string;
}

export interface GeneratedPost {
  id: string;
  type: ContentType.SOCIAL_POST;
  content: GeneratedPostContent;
  imageUrl: string;
  topic: string;
  tone: Tone;
  imageStyle: ImageStyle;
}

export interface GeneratedQuote {
    id: string;
    type: ContentType.QUOTE;
    quotes: string[];
    category: QuoteCategory;
}

export interface GeneratedIllustratedText {
    id: string;
    type: ContentType.ILLUSTRATED_TEXT;
    topic: string;
    text: string;
    imageUrl: string;
}

export type GeneratedItem = GeneratedPost | GeneratedQuote | GeneratedIllustratedText;

export interface TrendItem {
  keyword: string;
  score: number;
  source: string;
  summary?: string;
}

export interface CampaignMetric {
  name: string;
  engagementRate: number;
  ctr: number;
  comments: number;
}