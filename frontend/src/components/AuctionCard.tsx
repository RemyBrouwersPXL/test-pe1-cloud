import React from 'react';
import { MapPin, Gauge, ShieldCheck, Zap } from 'lucide-react';
import { Auction } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface AuctionCardProps {
  auction: Auction;
  onClick: (id: number) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onClick }) => {
  return (
    <div
      onClick={() => onClick(auction.id)}
      className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 hover:shadow-2xl hover:shadow-amber-500/5 transition duration-300 flex flex-col cursor-pointer"
    >
      {/* Thumbnail & Overlays */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={auction.thumbnail_url}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {/* Reserve status badge */}
          {auction.is_no_reserve ? (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
              No Reserve
            </span>
          ) : auction.reserve_met ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white backdrop-blur-sm shadow flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Reserve Met
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-slate-300 backdrop-blur-sm border border-slate-700/60 shadow">
              Reserve
            </span>
          )}

          {/* Countdown Clock */}
          <div className="pointer-events-auto">
            <CountdownTimer endTime={auction.end_time} status={auction.status} compact />
          </div>
        </div>

        {/* Status banner if ended */}
        {auction.status !== 'ACTIVE' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className={`px-4 py-1.5 rounded-xl text-sm font-black tracking-widest uppercase border ${
              auction.status === 'SOLD'
                ? 'bg-emerald-600/90 text-white border-emerald-400'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {auction.status === 'SOLD' ? 'SOLD' : 'RESERVE NOT MET'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition line-clamp-2 leading-snug">
            {auction.title}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium">
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
              {auction.mileage ? `${auction.mileage.toLocaleString()} mi` : 'Low Miles'}
            </span>
            <span>•</span>
            <span className="truncate max-w-[110px]">
              {auction.transmission || 'Manual'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 truncate max-w-[100px]">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {auction.location}
            </span>
          </div>
        </div>

        {/* Pricing / Bidding Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              {auction.status === 'SOLD' ? 'Winning Bid' : 'Current Bid'}
            </span>
            <span className="text-lg font-black text-amber-400">
              ${Number(auction.current_bid).toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Bids
            </span>
            <span className="text-xs font-bold text-slate-300 inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> {auction.total_bids}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
