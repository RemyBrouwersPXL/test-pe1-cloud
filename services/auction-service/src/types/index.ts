export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  is_seller: boolean;
  is_admin: boolean;
  created_at: Date;
}

export interface Vehicle {
  id: number;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  transmission: string;
  drivetrain: string;
  engine: string;
  exterior_color: string;
  interior_color: string;
  body_style: string;
  highlights: string[];
  equipment: string[];
  modifications: string[];
  known_flaws: string[];
  created_at: Date;
}

export type AuctionStatus = 'ACTIVE' | 'ENDED' | 'SOLD' | 'RESERVE_NOT_MET' | 'CANCELED';

export interface Auction {
  id: number;
  vehicle_id: number;
  seller_id: number;
  title: string;
  slug: string;
  description: string;
  dougs_take?: string;
  starting_bid: number;
  current_bid: number;
  reserve_price?: number;
  is_no_reserve: boolean;
  reserve_met: boolean;
  min_increment: number;
  start_time: Date;
  end_time: Date;
  status: AuctionStatus;
  high_bidder_id?: number;
  total_bids: number;
  views_count: number;
  thumbnail_url: string;
  gallery_images: string[];
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface Bid {
  id: number;
  auction_id: number;
  bidder_id: number;
  amount: number;
  created_at: Date;
  bidder_username?: string;
}

export interface Comment {
  id: number;
  auction_id: number;
  user_id: number;
  parent_comment_id?: number;
  content: string;
  is_seller_comment: boolean;
  created_at: Date;
  author_name?: string;
  author_username?: string;
  author_avatar?: string;
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isAdmin?: boolean;
  }
}
