import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Gauge, ShieldCheck, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { Auction, Bid, Comment, InspectionData } from '../types';
import { auctionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { InspectionCard } from '../components/InspectionCard';

interface AuctionDetailPageProps {
  auctionId: number;
  onBack: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const AuctionDetailPage: React.FC<AuctionDetailPageProps> = ({
  auctionId,
  onBack,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    auction: Auction | null;
    bids: Bid[];
    comments: Comment[];
    inspection: InspectionData | null;
  }>({
    auction: null,
    bids: [],
    comments: [],
    inspection: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Bidding states
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [biddingLoading, setBiddingLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccessMessage, setBidSuccessMessage] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await auctionApi.getAuctionDetail(auctionId);
      setData(res);

      // Initialize default next minimum bid
      const current = Number(res.auction.current_bid);
      const inc = Number(res.auction.min_increment || 100);
      setBidAmount(res.auction.total_bids === 0 ? current : current + inc);
    } catch (err) {
      console.error('Error loading auction details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [auctionId]);

  if (loading || !data.auction) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading auction specifications & telemetry...</p>
      </div>
    );
  }

  const { auction, bids, comments, inspection } = data;
  const images = auction.gallery_images && auction.gallery_images.length > 0
    ? auction.gallery_images
    : [auction.thumbnail_url];

  const minAllowedBid = auction.total_bids === 0
    ? Number(auction.current_bid)
    : Number(auction.current_bid) + Number(auction.min_increment);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }

    try {
      setBiddingLoading(true);
      setBidError(null);
      setBidSuccessMessage(null);

      const res = await auctionApi.placeBid(auction.id, bidAmount);

      setBidSuccessMessage(
        res.anti_sniping_extended
          ? `🔥 Bid accepted! Anti-sniping triggered: Auction extended by 2 minutes until ${new Date(res.new_end_time).toLocaleTimeString()}!`
          : `✅ Your bid of $${bidAmount.toLocaleString()} has been placed successfully!`
      );

      // Refresh auction state
      await fetchDetails();
    } catch (err: any) {
      setBidError(err.response?.data?.error || 'Failed to place bid');
    } finally {
      setBiddingLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setCommentLoading(true);
      await auctionApi.postComment(auction.id, commentText);
      setCommentText('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const isSeller = user && user.id === auction.seller_id;
  const isHighBidder = user && user.id === auction.high_bidder_id;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all listings
      </button>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {auction.is_no_reserve ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                No Reserve
              </span>
            ) : auction.reserve_met ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Reserve Met
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                Reserve Auction
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">VIN: {auction.vin || 'N/A'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {auction.title}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
              <Gauge className="w-4 h-4 text-slate-500" />
              {auction.mileage ? `${auction.mileage.toLocaleString()} Miles` : 'Low Mileage'}
            </span>
            <span>•</span>
            <span className="text-slate-300 font-semibold">{auction.transmission}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-300 font-semibold">
              <MapPin className="w-4 h-4 text-slate-500" />
              {auction.location}
            </span>
            <span>•</span>
            <span className="text-slate-400">Seller: <strong className="text-amber-400">@{auction.seller_username}</strong></span>
          </div>
        </div>

        {/* Live Countdown Clock */}
        <div className="flex items-center gap-3">
          <CountdownTimer endTime={auction.end_time} status={auction.status} onExpire={fetchDetails} />
        </div>
      </div>

      {/* Main Grid: Gallery & Bidding Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero Photo */}
          <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <img
              src={images[activeImageIndex]}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    activeImageIndex === idx ? 'border-amber-500 scale-95' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Specs Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Vehicle Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Make & Model</span>
                <span className="font-bold text-slate-200">{auction.year} {auction.make} {auction.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Drivetrain</span>
                <span className="font-bold text-slate-200">{auction.drivetrain || 'RWD'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Engine</span>
                <span className="font-bold text-slate-200">{auction.engine}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transmission</span>
                <span className="font-bold text-slate-200">{auction.transmission}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Exterior Color</span>
                <span className="font-bold text-slate-200">{auction.exterior_color}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Interior Color</span>
                <span className="font-bold text-slate-200">{auction.interior_color}</span>
              </div>
            </div>
          </div>

          {/* Doug's Take (Cars & Bids Signature Editorial) */}
          {auction.dougs_take && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/40 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-black text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Doug's Take</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                "{auction.dougs_take}"
              </p>
              <div className="mt-3 text-[11px] text-amber-400/80 font-bold uppercase tracking-widest">
                — Doug DeMuro, GearBids Editorial
              </div>
            </div>
          )}

          {/* Highlights & Equipment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">Highlights</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                {auction.highlights && auction.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            {auction.equipment && auction.equipment.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">Equipment & Factory Options</h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                  {auction.equipment.map((eq, i) => (
                    <li key={i}>{eq}</li>
                  ))}
                </ul>
              </div>
            )}

            {auction.known_flaws && auction.known_flaws.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-2">Known Flaws & Imperfections</h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                  {auction.known_flaws.map((flaw, i) => (
                    <li key={i}>{flaw}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Vehicle Inspection Report (From Inspection Microservice) */}
          <InspectionCard inspection={inspection} vin={auction.vin || ''} />
        </div>

        {/* Right Column: Live Bidding Box & Bid Audit History */}
        <div className="space-y-6">
          {/* Bidding Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-20 space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {auction.status === 'SOLD' ? 'Final Selling Price' : 'Current High Bid'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-400">
                  ${Number(auction.current_bid).toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({auction.total_bids} bids)
                </span>
              </div>
              {auction.high_bidder_username && (
                <p className="text-xs text-slate-400 mt-1">
                  High bidder: <strong className="text-slate-200">@{auction.high_bidder_username}</strong>
                  {isHighBidder && <span className="ml-1.5 text-emerald-400 font-bold">(You!)</span>}
                </p>
              )}
            </div>

            {/* Anti-Sniping Explanation Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Anti-Sniping Protection</strong>
                Bids placed in the final 2 minutes automatically add 2 minutes to the clock to ensure fair bidding.
              </div>
            </div>

            {/* Notifications / Alerts */}
            {bidSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {bidSuccessMessage}
              </div>
            )}
            {bidError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {bidError}
              </div>
            )}

            {/* Bidding Controls */}
            {auction.status !== 'ACTIVE' ? (
              <div className="p-4 rounded-xl bg-slate-800/80 text-center">
                <span className="text-sm font-bold text-slate-300 block">
                  {auction.status === 'SOLD' ? '🎉 Auction Sold!' : 'Auction Concluded'}
                </span>
                <span className="text-xs text-slate-500">
                  {auction.status === 'SOLD'
                    ? `Winning bid: $${Number(auction.current_bid).toLocaleString()}`
                    : 'Reserve price was not reached.'}
                </span>
              </div>
            ) : !user ? (
              <div className="space-y-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/10"
                >
                  Sign In with Session Cookie to Bid
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Test accounts: <code>track_day_bro</code> or <code>student_evaluator</code>
                </p>
              </div>
            ) : isSeller ? (
              <div className="p-3 rounded-xl bg-slate-800 text-center text-xs text-slate-400 font-medium">
                You are the seller of this listing. Sellers cannot bid on their own auctions.
              </div>
            ) : (
              <form onSubmit={handlePlaceBid} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                    <span>Your Bid ($ USD)</span>
                    <span className="text-slate-500">Min bid: ${minAllowedBid.toLocaleString()}</span>
                  </label>
                  <input
                    type="number"
                    step="100"
                    min={minAllowedBid}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-amber-400 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Quick Bid Increment Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 250, 500, 1000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setBidAmount(minAllowedBid + inc - (auction.total_bids === 0 ? 0 : Number(auction.min_increment)))}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition"
                    >
                      +${inc}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={biddingLoading || bidAmount < minAllowedBid}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-amber-500/10 disabled:opacity-40"
                >
                  {biddingLoading ? 'Submitting Bid...' : `Place Bid ($${bidAmount.toLocaleString()})`}
                </button>
              </form>
            )}

            {/* Bid History Table */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Bid History</span>
                <span className="text-[10px] text-slate-500">{bids.length} bids recorded</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bids.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No bids placed yet. Be the first!</p>
                ) : (
                  bids.map((b, i) => (
                    <div
                      key={b.id}
                      className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                        i === 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">@{b.bidder_username}</span>
                        {i === 0 && <span className="text-[9px] uppercase px-1 rounded bg-amber-400 text-slate-950 font-black">High</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-amber-400 block">${Number(b.amount).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Comments & Q&A Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Comments & Questions ({comments.length})</h3>
          </div>
        </div>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask the seller about mechanical condition, service history, or cosmetics..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-slate-800/60 text-center">
            <p className="text-xs text-slate-400">
              <button
                onClick={() => onOpenAuth('login')}
                className="font-bold text-amber-400 hover:underline mr-1"
              >
                Sign in
              </button>
              with your session cookie to ask a question or join the discussion.
            </p>
          </div>
        )}

        {/* Comments feed */}
        <div className="space-y-4 pt-2">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No comments yet. Have a question for the seller?</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border ${
                  comment.is_seller_comment
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-slate-800/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">@{comment.username}</span>
                    {comment.is_seller_comment && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                        Seller
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
