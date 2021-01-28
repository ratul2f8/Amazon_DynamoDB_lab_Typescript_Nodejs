export interface MovieInfo {
    year: number;
    title: string;
    info: Info;
  }
export interface Info {
    directors?: (string)[] | null;
    release_date?: string;
    rating?: number;
    genres?: (string)[] | null;
    image_url?: string;
    plot?: string;
    rank?: number;
    running_time_secs?: number;
    actors?: (string)[] | null;
  }
  