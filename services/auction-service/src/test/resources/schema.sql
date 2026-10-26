CREATE DOMAIN IF NOT EXISTS auction_status AS VARCHAR(50);

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    year INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    mileage INT NOT NULL,
    transmission VARCHAR(50) NOT NULL,
    drivetrain VARCHAR(20) NOT NULL,
    engine VARCHAR(120) NOT NULL,
    exterior_color VARCHAR(80) NOT NULL,
    interior_color VARCHAR(80) NOT NULL,
    body_style VARCHAR(50) NOT NULL,
    highlights TEXT ARRAY NOT NULL,
    equipment TEXT ARRAY NOT NULL,
    modifications TEXT ARRAY NOT NULL,
    known_flaws TEXT ARRAY NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL,
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    dougs_take TEXT,
    starting_bid NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    current_bid NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    reserve_price NUMERIC(12, 2) DEFAULT NULL,
    is_no_reserve BOOLEAN NOT NULL DEFAULT FALSE,
    reserve_met BOOLEAN NOT NULL DEFAULT FALSE,
    min_increment NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status NOT NULL DEFAULT 'ACTIVE',
    high_bidder_id INT,
    total_bids INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(500) NOT NULL,
    gallery_images TEXT ARRAY NOT NULL DEFAULT (ARRAY[]),
    location VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT,
    content TEXT NOT NULL,
    is_seller_comment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    auction_id INT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL,
    vin VARCHAR(17) NOT NULL,
    overall_condition_score INT NOT NULL,
    mechanical_score INT NOT NULL,
    cosmetic_score INT NOT NULL,
    estimated_low_valuation NUMERIC(12, 2) NOT NULL,
    estimated_high_valuation NUMERIC(12, 2) NOT NULL,
    accident_reported BOOLEAN NOT NULL DEFAULT FALSE,
    owner_count INT NOT NULL DEFAULT 1,
    recalls_count INT NOT NULL DEFAULT 0,
    inspection_report JSON DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
