export type ModerationStatus = "approved" | "pending" | "rejected";
export type DemoStatus = "none" | "moderation" | "ready";

export interface Niche {
  tag: string;
  games_count: number;
  median_price_usd: number;
  median_reviews: number;
  positive_share: number;
  method: string;
  collected_at: string;
}

export interface PitchVersion {
  version: number;
  hash: string;
  created_at: string;
}

export interface Project {
  slug: string;
  title: string;
  author: string;
  genre: string;
  tags: string[];
  stage: string;
  cover_color: string;
  teaser: string;
  description: string;
  moderation_status: ModerationStatus;
  moderation_reason?: string;
  published_at: string | null;
  niche: Niche;
  pitch: { public_version: number; versions: PitchVersion[]; excerpt: string };
  demo: { status: DemoStatus; url?: string; size_bytes?: number; uploaded_at?: string };
  private_materials: string[];
}

export type ModerationKind = "publication" | "card_edit" | "demo";

export interface ModerationItem {
  id: string;
  kind: ModerationKind;
  project_slug: string;
  project_title: string;
  author: string;
  submitted_at: string;
  summary: string;
}

export interface ModerationDecision {
  id: string;
  decision: "approved" | "rejected";
  reason?: string;
  decided_at: string;
}
