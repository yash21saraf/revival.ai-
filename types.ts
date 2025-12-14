
export interface Segment {
  startTime: string;
  endTime: string;
  summary: string;
  subjects: string[];
  needsUpdate?: boolean;
}

export interface OutdatedItem {
  subject: string;
  oldTool: string;
  newTool: string;
  reason: string;
  impactScore: number; // 1-10
  affectedSegmentIndices?: number[]; // Indices of segments in the segments array
}

export interface RevivalStrategy {
  originalVideoMetadata?: {
    title: string;
    publishDate: string;
    currentViews: number;
  };
  segments: Segment[];
  outdatedItems: OutdatedItem[];
  revivalPlan?: {
    title: string;
    description: string;
    scriptOutline: string; // Markdown
  };
  revivalSummary?: string;
  predictedViews: number;
  predictedEngagement: number;
}

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
}

export enum AppState {
  IDLE,
  PROCESSING_VIDEO,
  ANALYZING_CONTENT,
  RESEARCHING,
  COMPLETE,
  ERROR
}
