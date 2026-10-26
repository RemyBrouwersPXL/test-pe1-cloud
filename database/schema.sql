-- ==============================================================================
-- GearBids Auction Platform - Database Schema
-- Designed for AWS EC2 Microservices Evaluation Exercise
-- ==============================================================================

-- Drop tables in dependency order if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create extension for UUID generation if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & SESSION STORE (Old-school session cookie auth)
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(100),
    is_seller BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- ------------------------------------------------------------------------------
-- 2. VEHICLES
-- ------------------------------------------------------------------------------
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    year INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    mileage INT NOT NULL,
    transmission VARCHAR(50) NOT NULL, -- '6-Speed Manual', 'Dual-Clutch', etc.
    drivetrain VARCHAR(20) NOT NULL,   -- 'RWD', 'AWD', '4WD', 'FWD'
    engine VARCHAR(120) NOT NULL,      -- '3.0L Twin-Turbo Inline-6', etc.
    exterior_color VARCHAR(80) NOT NULL,
    interior_color VARCHAR(80) NOT NULL,
    body_style VARCHAR(50) NOT NULL,   -- 'Coupe', 'Sedan', 'SUV', 'Wagon', etc.
    highlights TEXT[] NOT NULL,        -- Array of bullet highlights
    equipment TEXT[] NOT NULL,         -- Array of factory options
    modifications TEXT[] NOT NULL,     -- Array of aftermarket mods
    known_flaws TEXT[] NOT NULL,       -- Array of imperfections/wear
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);

-- ------------------------------------------------------------------------------
-- 3. AUCTIONS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE auction_status AS ENUM ('ACTIVE', 'ENDED', 'SOLD', 'RESERVE_NOT_MET', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    dougs_take TEXT,                   -- Enthusiast review blurb (Cars & Bids signature)
    starting_bid NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    current_bid NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    reserve_price NUMERIC(12, 2) DEFAULT NULL, -- NULL = No Reserve, or secret amount
    is_no_reserve BOOLEAN NOT NULL DEFAULT FALSE,
    reserve_met BOOLEAN NOT NULL DEFAULT FALSE,
    min_increment NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status NOT NULL DEFAULT 'ACTIVE',
    high_bidder_id INT REFERENCES users(id),
    total_bids INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(500) NOT NULL,
    gallery_images TEXT[] NOT NULL DEFAULT '{}',
    location VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_auctions_status_end_time ON auctions(status, end_time);
CREATE INDEX idx_auctions_seller ON auctions(seller_id);
CREATE INDEX idx_auctions_slug ON auctions(slug);

-- ------------------------------------------------------------------------------
-- 4. BIDS
-- ------------------------------------------------------------------------------
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bids_auction ON bids(auction_id, amount DESC);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- ------------------------------------------------------------------------------
-- 5. COMMENTS & COMMUNITY Q&A
-- ------------------------------------------------------------------------------
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_seller_comment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_auction ON comments(auction_id, created_at);

-- ------------------------------------------------------------------------------
-- 6. NOTIFICATIONS (For Outbid, Auction Ended, etc.)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('OUTBID', 'AUCTION_WON', 'AUCTION_ENDED', 'BID_PLACED', 'COMMENT_REPLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auction_id INT REFERENCES auctions(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. INSPECTIONS & VALUATIONS (Vehicle Inspection Microservice)
-- ------------------------------------------------------------------------------
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vin VARCHAR(17) NOT NULL,
    overall_condition_score INT NOT NULL CHECK (overall_condition_score BETWEEN 1 AND 100),
    mechanical_score INT NOT NULL CHECK (mechanical_score BETWEEN 1 AND 100),
    cosmetic_score INT NOT NULL CHECK (cosmetic_score BETWEEN 1 AND 100),
    estimated_low_valuation NUMERIC(12, 2) NOT NULL,
    estimated_high_valuation NUMERIC(12, 2) NOT NULL,
    accident_reported BOOLEAN NOT NULL DEFAULT FALSE,
    owner_count INT NOT NULL DEFAULT 1,
    recalls_count INT NOT NULL DEFAULT 0,
    inspection_report JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inspections_vehicle ON inspections(vehicle_id);
CREATE INDEX idx_inspections_vin ON inspections(vin);
