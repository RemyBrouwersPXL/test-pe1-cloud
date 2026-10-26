-- ==============================================================================
-- GearBids Auction Platform - Realistic Seed Data
-- Authentic Cars & Bids listings, enthusiast specs, real photos, bids, and comments
-- ==============================================================================

-- Clear existing data
TRUNCATE TABLE notifications, comments, bids, inspections, auctions, vehicles, sessions, users RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------------------------
-- 1. SEED USERS
-- All sample users share the password: 'password123'
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, avatar_url, bio, location, is_seller, is_admin) VALUES
(1, 'doug_demuro', 'doug@gearbids.com', '$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm', 'Doug DeMuro', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'Founder & Enthusiast. THIS... is GearBids!', 'San Diego, CA', TRUE, TRUE),
(2, 'car_collector_99', 'collector@example.com', '$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'Lifelong JDM and European sports car curator.', 'Austin, TX', TRUE, FALSE),
(3, 'track_day_bro', 'trackday@example.com', '$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm', 'Elena Rostova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'Club racer, HPDE instructor, manual gearbox enthusiast.', 'Atlanta, GA', FALSE, FALSE),
(4, 'turbo_enthusiast', 'turbo@example.com', '$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm', 'David Chen', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 'Twin-turbo everything. 90s homologation specials collector.', 'Seattle, WA', FALSE, FALSE),
(5, 'student_evaluator', 'evaluator@pxl.be', '$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm', 'Cloud Evaluation Account', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', 'Course Evaluator test account for DevOps and microservice validation.', 'Hasselt, Belgium', TRUE, TRUE);

ALTER SEQUENCE users_id_seq RESTART WITH 6;

-- ------------------------------------------------------------------------------
-- 2. SEED VEHICLES
-- ------------------------------------------------------------------------------
INSERT INTO vehicles (id, vin, year, make, model, trim, mileage, transmission, drivetrain, engine, exterior_color, interior_color, body_style, highlights, equipment, modifications, known_flaws) VALUES
(1, 'JHMAP11422T001842', 2002, 'Honda', 'S2000', 'Base AP1', 38200, '6-Speed Manual', 'RWD', '2.0L VTEC Inline-4 (F20C, 9000 RPM)', 'Spa Yellow Pearl', 'Black Leather', 'Convertible',
 ARRAY['Factory AP1 with legendary 9,000-RPM F20C engine', 'Low indicated mileage of ~38,200 miles', 'Original Spa Yellow Pearl paint with factory VIN stickers on all panels', 'Clean Carfax with no accident or damage history'],
 ARRAY['16-inch BBS factory alloy wheels', 'High X-bone frame structure', 'Factory Torsen limited-slip differential', 'Aluminum shift knob and drilled pedals', 'Power convertible soft top with glass rear window upgrade', 'Push-button starter engine start'],
 ARRAY['OEM titanium shift knob', 'K&N drop-in high-flow air filter'],
 ARRAY['Minor stone chipping on front bumper fascia', 'Slight bolster creasing on driver side seat']
),

(2, 'JT2JA82J5V0019234', 1997, 'Toyota', 'Supra', 'Turbo 15th Anniversary', 42150, '6-Speed Manual (V160)', 'RWD', '3.0L Twin-Turbo Inline-6 (2JZ-GTE)', 'Royal Sapphire Pearl', 'Black Leather', 'Coupe',
 ARRAY['Rare 15th Anniversary Limited Edition in Royal Sapphire Pearl', 'Factory 6-speed Getrag V160 manual transmission', 'Unmodified twin-turbo 2JZ-GTE engine', 'Removable sport targa roof with factory storage latches'],
 ARRAY['Factory polished 17-inch alloy wheels', 'Limited-slip differential (LSD)', 'Automatic climate control', 'Power driver seat and premium audio system', 'Factory rear hoop spoiler'],
 ARRAY['HKS Hi-Power stainless steel cat-back exhaust (OEM exhaust included)', 'Tein Street Advance adjustable coilovers'],
 ARRAY['Light scuff on lower front lip spoiler', 'Minor wear on passenger floor mat']
),

(3, 'WP0AC29944S692185', 2004, 'Porsche', '911 GT3', '996.2 GT3 Clubsport Spec', 24800, '6-Speed Manual', 'RWD', '3.6L Naturally Aspirated Flat-6 (Mezger 381 HP)', 'Guards Red', 'Black Leather / Alcantara', 'Coupe',
 ARRAY['First generation GT3 offered in North America with Mezger racing engine', 'Only ~24,800 miles from new', 'DME report confirms zero Type 2 over-revs in past 10,000 miles', 'PCCB ceramic brakes replaced with steel GiroDisc rotors for track reliability'],
 ARRAY['Factory bucket sport seats with embossed Porsche crests', 'Bi-Xenon headlights', 'Lightweight flywheel and sport clutch', 'Aero package with adjustable carbon fiber rear wing'],
 ARRAY['GiroDisc two-piece floating brake rotors with Pagid RS29 pads', 'Clear bra paint protection film on front bumper and hood'],
 ARRAY['Front chin spoiler has light road scraping underneath (replaceable OEM part)']
),

(4, 'WBSAK010802194821', 1991, 'BMW', 'M3', 'E30 Evolution II Look', 68400, '5-Speed Manual (Getrag 265)', 'RWD', '2.3L DOHC Inline-4 (S14, 192 HP)', 'Diamond Black Metallic', 'Anthracite M-Technic Cloth', 'Coupe',
 ARRAY['Original North American specification E30 M3 homologation special', 'Box-flared fenders and high-revving S14 motorsport power plant', 'Extensive service records dating back to 1995 with recent valve adjustment', 'Matching numbers chassis and engine'],
 ARRAY['15-inch BBS basketweave wheels', 'Sport bucket seats with M tricolor accents', 'Power sunroof and power windows', 'Factory 25% locking limited slip differential'],
 ARRAY['Supersprint stainless steel sport exhaust', 'Bilstein B8 performance shocks with H&R sport springs'],
 ARRAY['Very faint clear coat age spot on driver rear quarter panel', 'Odometer gear replaced at 62k miles with documentation']
),

(5, 'JM1FD3317R0201948', 1994, 'Mazda', 'RX-7', 'Touring Package FD', 47300, '5-Speed Manual', 'RWD', '1.3L Twin-Turbo Rotary (13B-REW)', 'Montego Blue Mica', 'Tan Leather', 'Coupe',
 ARRAY['Iconic FD chassis with sequential twin-turbocharged rotary engine', 'Compression test results: 8.2+ bar across all rotor faces (tested Aug 2026)', 'Factory pop-up headlights functioning flawlessly', 'Clean title with Arizona ownership history'],
 ARRAY['Factory glass sunroof', 'Bose Acoustic Wave rear sound system', 'Cruise control and dual front airbags', 'Four-wheel ventilated disc brakes with 4-piston front calipers'],
 ARRAY['Koyo aluminum heavy-duty radiator upgrade for enhanced cooling', 'Silicone vacuum hose reliability kit (Pettit Racing)'],
 ARRAY['Driver seat outer bolster shows typical leather aging', 'Small scratch near fuel filler door']
),

(6, '1FMEE5DP6MLA10294', 2021, 'Ford', 'Bronco', 'Badlands First Edition', 14200, '10-Speed Automatic', '4WD', '2.7L EcoBoost Twin-Turbo V6 (330 HP)', 'Cyber Orange Metallic', 'Black Onyx Leather', 'SUV',
 ARRAY['Extremely desirable Badlands First Edition 4-Door', 'Sasquatch Package with 35-inch Goodyear Territory mud-terrain tires', 'Advanced 4x4 system with locking front and rear differentials', 'Removable hardtop and removable doors with factory storage bags'],
 ARRAY['High-Clearance Bilstein position-sensitive dampers', 'Front stabilizer bar disconnect mechanism', '12-inch SYNC 4 touchscreen with 360-degree camera', 'Adaptive cruise control and Bang & Olufsen 10-speaker audio system'],
 ARRAY['Rigid Industries auxiliary cowl-mounted LED trail lights', 'Ford Performance heavy-duty rock sliders'],
 ARRAY['Minor dust scratching on plastic fender flares from trail use']
),

(7, 'WUAKD78E589901842', 2008, 'Audi', 'RS4', 'quattro Sedan', 55600, '6-Speed Manual', 'AWD', '4.2L Naturally Aspirated V8 (420 HP, 8250 RPM)', 'Avus Silver Pearl', 'Black Silk Nappa Leather', 'Sedan',
 ARRAY['Naturally aspirated high-revving 4.2L V8 delivering 420 horsepower', 'Offered exclusively with a 6-speed manual transmission and rear-biased quattro AWD', 'DRC (Dynamic Ride Control) suspension professionally serviced', 'Carbon fiber interior trim package with brushed aluminum mirrors'],
 ARRAY['19-inch 7-arm twin-spoke alloy wheels', 'Recaro heated leather sport seats', 'Audi Navigation Plus system with Bose sound', 'Power glass sunroof and rear park distance control'],
 ARRAY['Milltek non-resonated cat-back valved exhaust system', 'Carbon intake cleaning service performed at 50,000 miles'],
 ARRAY['Curb rash on right front wheel lip', 'Very light wear on steering wheel leather at 9 oclock position']
),

(8, 'BNR34001942000000', 1999, 'Nissan', 'Skyline GT-R', 'V-Spec BNR34', 51200, '6-Speed Manual (Getrag)', 'AWD', '2.6L Twin-Turbocharged Inline-6 (RB26DETT)', 'Bayside Blue', 'Black / Gray Cloth', 'Coupe',
 ARRAY['Authentic V-Spec in iconic Bayside Blue paintwork', 'Legendary ATTESA E-TS Pro all-wheel drive with Active LSD', 'Factory Multi-Function Display (MFD) with boost and G-meter telemetry', 'Recently legally imported under 25-year NHTSA exemption'],
 ARRAY['18-inch forged BBS factory wheels', 'Brembo gold multi-piston brakes', 'Front and rear carbon fiber underbody diffusers', 'Xenon headlights and rear window wiper'],
 ARRAY['Nismo front bumper and side skirt aero kit', 'HKS induction intake kit', 'Nismo stainless cat-back sports exhaust'],
 ARRAY['Slight pixel fading on top line of MFD LCD display', 'Minor rock chip touch-up near lower left intercooler intake duct']
);

ALTER SEQUENCE vehicles_id_seq RESTART WITH 9;

-- ------------------------------------------------------------------------------
-- 3. SEED AUCTIONS
-- Times are dynamically calculated around NOW() to provide:
--   - Active auctions with 5 days remaining
--   - Ending soon auction with ~3 minutes remaining (anti-sniping demo!)
--   - Urgent auction with ~30 seconds remaining (worker closing demo!)
--   - Historic SOLD and RESERVE_NOT_MET auctions
-- ------------------------------------------------------------------------------
INSERT INTO auctions (
    id, vehicle_id, seller_id, title, slug, description, dougs_take, 
    starting_bid, current_bid, reserve_price, is_no_reserve, reserve_met, 
    min_increment, start_time, end_time, status, high_bidder_id, total_bids, 
    thumbnail_url, gallery_images, location
) VALUES
(
    1, 1, 1, 
    '2002 Honda S2000 - 6-Speed, Unmodified, ~38k Miles',
    '2002-honda-s2000-spa-yellow',
    'This 2002 Honda S2000 is an AP1 example finished in Spa Yellow Pearl with a black leather interior. Power is delivered by the iconic high-revving 2.0-liter F20C inline-4 linked with a rifle-bolt 6-speed manual transmission. Features include 16-inch alloy wheels, a limited-slip differential, power soft top with glass rear window, air conditioning, and power windows. This AP1 remains largely original and is ready for high-RPM canyon carving.',
    'THIS is a 2002 Honda S2000 AP1, and in my opinion, it is one of the purest sports cars ever created! The 9,000-RPM redline never gets old, the gearbox action is second to none, and Spa Yellow Pearl is arguably the definitive color for the AP1 generation. With just 38,000 miles, this is a prime collector-grade example.',
    15000.00, 28500.00, 27000.00, FALSE, TRUE, 250.00,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'ACTIVE', 3, 14,
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80'
    ],
    'San Diego, CA'
),

(
    2, 2, 2,
    '1997 Toyota Supra Turbo - 6-Speed V160, Royal Sapphire Pearl',
    '1997-toyota-supra-turbo-rsp',
    'This 1997 Toyota Supra Turbo is a 15th Anniversary Edition model finished in ultra-rare Royal Sapphire Pearl over black leather. Under the hood is the legendary twin-turbocharged 3.0-liter 2JZ-GTE inline-6 mated to a Getrag 6-speed manual transmission. Factory equipment includes the removable sport roof, polished 17-inch alloy wheels, limited-slip differential, and rear wing. An absolute JDM holy grail in near-stock configuration.',
    'THIS is a 1997 Toyota Supra Turbo 15th Anniversary in Royal Sapphire Pearl! Clean, unmodified manual Supras are virtually impossible to find nowadays because nearly all of them were modified to produce 1,000 horsepower. This one has survived in sensational condition with under 43k miles.',
    40000.00, 89500.00, 85000.00, FALSE, TRUE, 500.00,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'ACTIVE', 4, 26,
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80'
    ],
    'Austin, TX'
),

(
    3, 3, 1,
    '2004 Porsche 911 GT3 (996.2) - 6-Speed, Mezger Flat-6, ~24k Miles',
    '2004-porsche-911-gt3-guards-red',
    'This 2004 Porsche 911 GT3 is finished in Guards Red over black leather with Alcantara accents. Power comes from a naturally aspirated 3.6-liter Mezger flat-6 factory rated at 381 horsepower, driving the rear wheels through a 6-speed manual transaxle and a limited-slip differential. Equipment includes lightweight bucket seats, fixed rear aero wing, and GiroDisc floating rotors.',
    'The 996.2 GT3 is the car that kicked off the GT3 legend in the United States. With no electronic stability control, hydraulic steering, and that glorious motorsport-derived Mezger powerplant that revs to 8,200 RPM, it is an unfiltered driving masterclass.',
    50000.00, 112000.00, NULL, TRUE, TRUE, 500.00,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP + INTERVAL '3 minutes', -- CLOSING SOON! Ideal for Anti-sniping evaluation!
    'ACTIVE', 3, 38,
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
    ],
    'San Diego, CA'
),

(
    4, 4, 2,
    '1991 BMW M3 (E30) - 5-Speed Manual, S14 Power, Diamond Black',
    '1991-bmw-m3-e30-diamond-black',
    'This 1991 BMW M3 is powered by the legendary 2.3-liter S14 inline-4 paired with a 5-speed manual transmission. Finished in Diamond Black Metallic over Anthracite M-Technic cloth interior, this iconic touring car homologation model features the hallmark box-flared fenders, integrated rear decklid spoiler, and 15-inch BBS wheels.',
    'The E30 M3 is the definitive collectible modern classic BMW. It won touring car championships across the globe and remains one of the finest-handling chassis ever engineered.',
    35000.00, 68000.00, 75000.00, FALSE, FALSE, 500.00,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP + INTERVAL '45 seconds', -- URGENT CLOSING! Ideal for Bidding-Worker lifecycle evaluation!
    'ACTIVE', 4, 19,
    'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
    ],
    'Austin, TX'
),

(
    5, 5, 1,
    '1994 Mazda RX-7 FD - Sequential Twin-Turbo, 5-Speed, Montego Blue',
    '1994-mazda-rx7-fd-montego-blue',
    'This 1994 Mazda RX-7 is finished in Montego Blue Mica over tan leather upholstery. Power is provided by a 1.3-liter 13B-REW sequential twin-turbocharged rotary engine paired with a 5-speed manual transmission. Recent maintenance includes an upgraded Koyo aluminum radiator and full rotary compression health test.',
    'The FD RX-7 is widely considered one of the most beautiful vehicle silhouettes ever sketched. The rotary engine delivers power with turbine smoothness unlike any piston engine on Earth.',
    20000.00, 41250.00, 40000.00, FALSE, TRUE, 250.00,
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    'ACTIVE', 2, 22,
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
    ],
    'San Diego, CA'
),

(
    6, 6, 2,
    '2021 Ford Bronco Badlands First Edition - Sasquatch, Cyber Orange',
    '2021-ford-bronco-badlands-first-edition',
    'This 2021 Ford Bronco Badlands First Edition 4-Door features Cyber Orange Metallic paint, the Sasquatch Package, and a twin-turbocharged 2.7-liter EcoBoost V6 engine linked to a 10-speed automatic transmission. Equipment includes front and rear locking differentials, Bilstein position-sensitive shocks, removable roof and doors, and SYNC 4.',
    'Ford brought back the Bronco in the best possible way. The First Edition combines the heavy-duty off-road capability of the Badlands with the luxurious tech interior.',
    30000.00, 52000.00, NULL, TRUE, TRUE, 250.00,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'SOLD', 3, 31,
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
    ],
    'Austin, TX'
),

(
    7, 7, 1,
    '2008 Audi RS4 - 6-Speed Manual, 4.2L V8 (8,250 RPM), Avus Silver',
    '2008-audi-rs4-avus-silver',
    'This 2008 Audi RS4 is finished in Avus Silver Pearl over black silk Nappa leather. Power is delivered by a naturally aspirated 4.2-liter V8 producing 420 hp at an exhilarating 8,250 RPM redline, routed through a 6-speed manual transmission and rear-biased quattro AWD. Features include heated Recaro bucket seats and carbon fiber trim.',
    'A high-revving naturally aspirated V8 sedan with a 6-speed manual gearbox and quattro all-weather traction. There will truly never be another vehicle like the B7 RS4.',
    25000.00, 36000.00, 42000.00, FALSE, FALSE, 250.00,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    'RESERVE_NOT_MET', 4, 15,
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80'
    ],
    'San Diego, CA'
),

(
    8, 8, 2,
    '1999 Nissan Skyline GT-R V-Spec (R34) - Bayside Blue, RB26DETT',
    '1999-nissan-skyline-gtr-v-spec-r34',
    'This 1999 Nissan Skyline GT-R is an authentic V-Spec finished in factory Bayside Blue. Featuring the legendary RB26DETT twin-turbo inline-6 and Getrag 6-speed manual, this R34 is equipped with ATTESA E-TS Pro AWD, factory Multi-Function Display (MFD), Brembo gold brakes, and carbon underbody aero.',
    'Godzilla at its very pinnacle. The R34 GT-R V-Spec in Bayside Blue is universally revered in car culture. Now legally eligible for US and European collectors under vintage import exemptions.',
    80000.00, 145000.00, 140000.00, FALSE, TRUE, 1000.00,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'ACTIVE', 4, 18,
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80'
    ],
    'Austin, TX'
);

ALTER SEQUENCE auctions_id_seq RESTART WITH 9;

-- ------------------------------------------------------------------------------
-- 4. SEED BIDS
-- ------------------------------------------------------------------------------
INSERT INTO bids (auction_id, bidder_id, amount, created_at) VALUES
-- Auction 1 (Honda S2000)
(1, 4, 18000.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 3, 21500.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 4, 25000.00, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 3, 28500.00, CURRENT_TIMESTAMP - INTERVAL '5 hours'),

-- Auction 2 (Toyota Supra Turbo)
(2, 3, 55000.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, 4, 70000.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 3, 82000.00, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 4, 89500.00, CURRENT_TIMESTAMP - INTERVAL '4 hours'),

-- Auction 3 (Porsche 911 GT3 - Ending soon!)
(3, 4, 85000.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 2, 98000.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 4, 105000.00, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(3, 3, 112000.00, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),

-- Auction 4 (BMW E30 M3 - Urgent!)
(4, 3, 45000.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(4, 4, 58000.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(4, 3, 64000.00, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(4, 4, 68000.00, CURRENT_TIMESTAMP - INTERVAL '10 minutes');

-- ------------------------------------------------------------------------------
-- 5. SEED COMMENTS & Q&A
-- ------------------------------------------------------------------------------
INSERT INTO comments (auction_id, user_id, parent_comment_id, content, is_seller_comment, created_at) VALUES
(1, 3, NULL, 'Do you have documentation for the glass rear soft top window conversion? Is the motor original?', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 1, 1, 'Yes! The conversion was done using genuine Honda OEM Robbins canvas with the glass upgrade in 2021. The soft top motor is original and opens/closes in ~6 seconds with no hesitation.', TRUE, CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '30 minutes'),
(2, 4, NULL, 'Has the 2JZ-GTE ever had any boost controllers or aftermarket single turbo setups installed, or has it remained stock twin-turbo its whole life?', FALSE, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 2, 3, 'Great question! It has remained 100% stock twin-turbo on factory ceramic turbochargers. The sequential transition at ~3,800 RPM is flawless and smooth.', TRUE, CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour'),
(3, 4, NULL, 'Any record of coolant pipe pinning or welding on this Mezger engine?', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 1, 5, 'Yes, the coolant lines were professionally pinned by BBI Autosport at 21,500 miles. Receipt is included in the photo gallery documents!', TRUE, CURRENT_TIMESTAMP - INTERVAL '20 hours');

-- ------------------------------------------------------------------------------
-- 6. SEED NOTIFICATIONS
-- ------------------------------------------------------------------------------
INSERT INTO notifications (user_id, auction_id, type, title, message, is_read, metadata, created_at) VALUES
(4, 1, 'OUTBID', 'You were outbid on 2002 Honda S2000!', 'Elena (track_day_bro) placed a higher bid of $28,500.', FALSE, '{"auction_id": 1, "bid_amount": 28500}', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(3, 2, 'OUTBID', 'You were outbid on 1997 Toyota Supra Turbo!', 'David (turbo_enthusiast) placed a higher bid of $89,500.', FALSE, '{"auction_id": 2, "bid_amount": 89500}', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(3, 6, 'AUCTION_WON', 'Congratulations! You won the 2021 Ford Bronco Badlands!', 'Winning bid: $52,000. Please contact the seller to finalize collection and title transfer.', TRUE, '{"auction_id": 6, "winning_bid": 52000}', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ------------------------------------------------------------------------------
-- 7. SEED INSPECTIONS & VALUATIONS (Inspection Microservice Data)
-- ------------------------------------------------------------------------------
INSERT INTO inspections (vehicle_id, vin, overall_condition_score, mechanical_score, cosmetic_score, estimated_low_valuation, estimated_high_valuation, accident_reported, owner_count, recalls_count, inspection_report) VALUES
(1, 'JHMAP11422T001842', 94, 98, 91, 26000.00, 32000.00, FALSE, 2, 0,
 '{"engine_health": "Exceptional", "vtec_engagement": "Confirmed at 6000 RPM", "clutch_life_remaining": "85%", "brake_pad_thickness_mm": 8.5, "paint_meter_readings_mils": [4.2, 4.5, 4.3, 4.1], "undercarriage_rust": "None detected"}'::jsonb),

(2, 'JT2JA82J5V0019234', 96, 97, 95, 82000.00, 98000.00, FALSE, 1, 0,
 '{"engine_health": "Factory Spec", "twin_turbo_boost_psi": 11.2, "compression_psi": [165, 164, 165, 163, 166, 165], "transmission_synchros": "Smooth across all 6 gears", "paint_meter_readings_mils": [3.8, 3.9, 4.0, 3.9], "targa_roof_seals": "Pliable, water tested dry"}'::jsonb),

(3, 'WP0AC29944S692185', 97, 99, 95, 105000.00, 125000.00, FALSE, 2, 0,
 '{"engine_health": "Pristine Mezger", "overrev_range_1": 12, "overrev_range_2": 0, "coolant_pipes": "Welded/Pinned", "suspension_bushings": "Tight, Monoball rear", "rotor_wear": "GiroDisc steel with 90% life remaining"}'::jsonb),

(4, 'WBSAK010802194821', 90, 93, 88, 65000.00, 80000.00, FALSE, 3, 0,
 '{"engine_health": "Strong S14", "valve_clearances": "Inspected and within factory spec", "differential_fluid": "Fresh Motul 75W140", "subframe_mounts": "Reinforced with no cracks"}'::jsonb);
