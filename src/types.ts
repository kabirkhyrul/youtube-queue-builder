export interface VideoData {
  title: string;
  duration: number; // in seconds
  videoId: string;
  channel: string;
  views: number;
  publishedTime: string; // js timestamp
  thumbnail: string; // img url
  description: string;
  isOfficialChannel: boolean;
}