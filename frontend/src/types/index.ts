export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  is_seller: boolean;
  is_admin: boolean;
  created_at: string;
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
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  high_bidder_id?: number;
  total_bids: number;
  views_count: number;
  thumbnail_url: string;
  gallery_images: string[];
  location: string;
  created_at: string;
  // Joined fields
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  transmission?: string;
  drivetrain?: string;
  engine?: string;
  exterior_color?: string;
  interior_color?: string;
  body_style?: string;
  highlights?: string[];
  equipment?: string[];
  modifications?: string[];
  known_flaws?: string[];
  seller_username?: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_bio?: string;
  high_bidder_username?: string;
}

export interface Bid {
  id: number;
  auction_id: number;
  bidder_id: number;
  amount: number;
  created_at: string;
  bidder_username?: string;
  bidder_avatar?: string;
}

export interface Comment {
  id: number;
  auction_id: number;
  user_id: number;
  parent_comment_id?: number;
  content: string;
  is_seller_comment: boolean;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  auction_id?: number;
  type: 'OUTBID' | 'AUCTION_WON' | 'AUCTION_ENDED' | 'BID_PLACED' | 'COMMENT_REPLY';
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface InspectionData {
  id: number;
  vehicle_id: number;
  vin: string;
  overall_condition_score: number;
  mechanical_score: number;
  cosmetic_score: number;
  estimated_low_valuation: number;
  estimated_high_valuation: number;
  accident_reported: boolean;
  owner_count: number;
  recalls_count: number;
  inspection_report: {
    chassis_integrity?: string;
    paint_depth_average_mils?: number;
    fluid_analysis?: string;
    obd2_scan_status?: string;
    compression_variance_percent?: number;
    clutch_or_trans_status?: string;
    [key: string]: any;
  };
}
