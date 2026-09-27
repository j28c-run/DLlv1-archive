export type Photo = {
  id: string;
  src: string;
  thumb: string;
  width?: number | null;
  height?: number | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  location?: string | null;
  category?: string | null;
  source: string;
  sourceUrl?: string | null;
  views: number;
  pinned: boolean;
  tags: string[];
  collections?: Array<{ id: string; name: string }>;
};

export type PhotoDetail = Photo & {
  related: Array<{
    id: string;
    src: string;
    thumb: string;
    title?: string | null;
    category?: string | null;
  }>;
};

export type Filters = {
  categories: string[];
  sources: string[];
  years: string[];
  tags: Array<{ name: string; count: number }>;
  total: number;
};

export type Stats = {
  total: number;
  tags: number;
  categories: number;
  years: number;
};

export const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  patreon: "Patreon",
  local: "Subida local",
  other: "Otra",
};
