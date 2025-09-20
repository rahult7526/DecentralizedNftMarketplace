# NFT Marketplace Event Indexer Setup Guide

## Overview
This indexer listens to marketplace events from the smart contract and stores them in Supabase for efficient querying. It provides REST API endpoints for the frontend to consume marketplace data.

## Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Note down your project URL and API keys
3. Update `.env.local` with your Supabase credentials

### 2. Database Schema
Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL UNIQUE,
  nft_contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  price TEXT NOT NULL,
  currency TEXT DEFAULT 'ETH',
  listing_type TEXT CHECK (listing_type IN ('FIXED_PRICE', 'AUCTION')) DEFAULT 'FIXED_PRICE',
  status TEXT CHECK (status IN ('ACTIVE', 'SOLD', 'CANCELLED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_to TEXT,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  metadata JSONB
);

-- Create auctions table
CREATE TABLE auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id TEXT NOT NULL UNIQUE,
  nft_contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  starting_bid TEXT NOT NULL,
  current_bid TEXT DEFAULT '0',
  current_bidder TEXT,
  reserve_price TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('ACTIVE', 'ENDED', 'CANCELLED')) DEFAULT 'ACTIVE',
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  metadata JSONB
);


-- Create bids table
CREATE TABLE bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id TEXT NOT NULL,
  bidder_address TEXT NOT NULL,
  bid_amount TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  FOREIGN KEY (auction_id) REFERENCES auctions(auction_id)
);

-- Create event processing tracking table
CREATE TABLE event_processing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  last_processed_block BIGINT NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_address, event_name)
);

-- Create indexes for better performance
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_seller ON listings(seller_address);
CREATE INDEX idx_listings_contract_token ON listings(nft_contract_address, token_id);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_auctions_seller ON auctions(seller_address);
CREATE INDEX idx_auctions_contract_token ON auctions(nft_contract_address, token_id);

CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_address);
CREATE INDEX idx_bids_created_at ON bids(created_at DESC);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_processing ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can read listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Public can read auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Public can read bids" ON bids FOR SELECT USING (true);

-- Create policies for service role (indexer) write access
CREATE POLICY "Service role can insert listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update listings" ON listings FOR UPDATE USING (true);
CREATE POLICY "Service role can insert auctions" ON auctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update auctions" ON auctions FOR UPDATE USING (true);
CREATE POLICY "Service role can insert bids" ON bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage event_processing" ON event_processing FOR ALL USING (true);
```

## Environment Configuration

Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Alchemy API Key for better RPC performance
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
```

## Running the Indexer

### Development Mode
```bash
npm run indexer:dev
```

### Production Mode
```bash
# Install as a service
npm run indexer:start

# Check status
npm run indexer:status

# Stop the service
npm run indexer:stop

# Restart the service
npm run indexer:restart
```

## API Endpoints

The indexer provides the following REST API endpoints:

- `GET /api/market/listings` - Get active marketplace listings
- `GET /api/market/auctions` - Get active auctions
- `GET /api/market/auctions/[auctionId]` - Get specific auction details
- `GET /api/market/bids?user=0x...` - Get user's bid history
- `GET /api/market/stats` - Get marketplace statistics

## Frontend Integration

The frontend uses SWR for efficient data fetching:

```typescript
import { useMarketplaceListings, useMarketplaceAuctions, useMarketplaceStats } from '@/lib/hooks/useMarketplaceAPI'

// In your component
const { data: listings, error, isLoading } = useMarketplaceListings()
const { data: auctions } = useMarketplaceAuctions()
const { data: stats } = useMarketplaceStats()
```

## Monitoring & Troubleshooting

1. **Check indexer logs**: The indexer logs events and errors to the console
2. **Monitor database**: Check Supabase dashboard for data consistency
3. **Event processing**: The `event_processing` table tracks the last processed block for each event type
4. **Restart indexer**: If the indexer gets stuck, restart it using `npm run indexer:restart`

## Architecture

```
Blockchain Events → Event Indexer → Supabase Database → REST API → Frontend (SWR)
```

The indexer continuously polls for new events, processes them, and stores the data in Supabase. The frontend fetches this data through REST API endpoints, providing a fast and efficient user experience.