import React, { useState, useEffect } from 'react';
import { Auction } from '../types';
import { auctionApi } from '../services/api';
import { AuctionCard } from '../components/AuctionCard';
import { Filter, Zap, Clock, ShieldCheck, Flame } from 'lucide-react';

interface HomePageProps {
  searchQuery: string;
  onSelectAuction: (id: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ searchQuery, onSelectAuction }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ENDING_SOON' | 'SOLD' | 'ALL'>('ACTIVE');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('');
  const [bodyStyleFilter, setBodyStyleFilter] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (activeTab === 'ACTIVE') {
        params.status = 'ACTIVE';
        params.sort = 'ending_soon';
      } else if (activeTab === 'ENDING_SOON') {
        params.status = 'ACTIVE';
        params.sort = 'ending_soon';
      } else if (activeTab === 'SOLD') {
        params.status = 'SOLD';
        params.sort = 'newly_listed';
      }

      if (transmissionFilter) params.transmission = transmissionFilter;
      if (bodyStyleFilter) params.body_style = bodyStyleFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await auctionApi.getAuctions(params);
      let list = data.auctions || [];

      // Filter locally for "Ending Soon" (less than 2 hours or urgent)
      if (activeTab === 'ENDING_SOON') {
        const now = new Date().getTime();
        list = list.filter((a) => {
          const end = new Date(a.end_time).getTime();
          return a.status === 'ACTIVE' && end - now < 2 * 3600 * 1000;
        });
      }

      setAuctions(list);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [activeTab, transmissionFilter, bodyStyleFilter, searchQuery]);

  useEffect(() => {
    auctionApi.getStats().then((data) => setStats(data.stats)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Stats Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Real-time Auctions & Anti-Sniping Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Buy & Sell Cool Cars with <span className="text-amber-400">Zero Sniping</span>.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            The enthusiast platform inspired by Cars & Bids. Every listing features verified VIN valuations, high-resolution galleries, and automatic 2-minute timer extensions when bids arrive near the buzzer.
          </p>

          {/* Quick Platform Metrics */}
          {stats && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Volume</span>
                <p className="text-lg font-black text-white">${Number(stats.total_sales_volume).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Auctions</span>
                <p className="text-lg font-black text-amber-400">{stats.active_auctions}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bids Placed</span>
                <p className="text-lg font-black text-white">{Number(stats.total_bids_placed).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Car Enthusiasts</span>
                <p className="text-lg font-black text-slate-200">{stats.total_registered_users}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Filtering Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Live Auctions
          </button>
          <button
            onClick={() => setActiveTab('ENDING_SOON')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ENDING_SOON'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-red-400" /> Ending Soon (Anti-Sniping)
          </button>
          <button
            onClick={() => setActiveTab('SOLD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'SOLD'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Past Results (Sold)
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Listings
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="">All Transmissions</option>
              <option value="Manual">Manual Gearbox</option>
              <option value="Dual-Clutch">Dual-Clutch / PDK</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={bodyStyleFilter}
              onChange={(e) => setBodyStyleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="">All Body Styles</option>
              <option value="Coupe">Coupe</option>
              <option value="Convertible">Convertible</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV / 4x4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Auctions */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <Filter className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-200">No auctions matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or switching between Live and Past Results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onClick={onSelectAuction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
