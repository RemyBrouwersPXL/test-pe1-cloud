import React, { useState } from 'react';
import { X, Plus, Car } from 'lucide-react';
import { auctionApi } from '../services/api';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newAuction: any) => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vin: '',
    year: 2005,
    make: '',
    model: '',
    trim: '',
    mileage: 45000,
    transmission: '6-Speed Manual',
    drivetrain: 'RWD',
    engine: '',
    exterior_color: '',
    interior_color: '',
    body_style: 'Coupe',
    starting_bid: 5000,
    reserve_price: 15000,
    is_no_reserve: false,
    duration_days: 7,
    location: 'Hasselt, Belgium',
    thumbnail_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
    description: '',
    dougs_take: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await auctionApi.createAuction({
        ...form,
        highlights: ['Documented service history', 'Original paint and panels', 'Clean title'],
        equipment: ['Power windows', 'Air conditioning', 'Alloy wheels'],
        modifications: ['None reported - OEM spec'],
        known_flaws: ['Light stone chips consistent with mileage'],
        gallery_images: [form.thumbnail_url],
      });
      onCreated(res.auction);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit auction listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Submit a Car for Auction</h2>
            <p className="text-xs text-slate-400">List an enthusiast vehicle on GearBids</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">VIN (17 chars)</label>
              <input
                type="text"
                required
                maxLength={17}
                placeholder="1FA6P8CF0H5192841"
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 uppercase"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Year</label>
              <input
                type="number"
                required
                min={1960}
                max={2026}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Make</label>
              <input
                type="text"
                required
                placeholder="Porsche, BMW, Toyota..."
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Model</label>
              <input
                type="text"
                required
                placeholder="911, Supra, M3..."
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Trim / Spec</label>
              <input
                type="text"
                placeholder="GT3, Turbo, Evolution..."
                value={form.trim}
                onChange={(e) => setForm({ ...form, trim: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Mileage</label>
              <input
                type="number"
                required
                min={0}
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="6-Speed Manual">6-Speed Manual</option>
                <option value="5-Speed Manual">5-Speed Manual</option>
                <option value="Dual-Clutch Automatic (PDK/DCT)">Dual-Clutch (PDK/DCT)</option>
                <option value="8-Speed Automatic">8-Speed Automatic</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Engine</label>
              <input
                type="text"
                placeholder="3.0L Twin-Turbo Inline-6"
                value={form.engine}
                onChange={(e) => setForm({ ...form, engine: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="Austin, TX or Brussels, BE"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Exterior Color</label>
              <input
                type="text"
                placeholder="Guards Red, Bayside Blue..."
                value={form.exterior_color}
                onChange={(e) => setForm({ ...form, exterior_color: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Interior Color</label>
              <input
                type="text"
                placeholder="Black Leather, Alcantara..."
                value={form.interior_color}
                onChange={(e) => setForm({ ...form, interior_color: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Primary Photo URL (Unsplash or CDN)</label>
            <input
              type="url"
              required
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Starting Bid ($)</label>
              <input
                type="number"
                step="500"
                min="500"
                value={form.starting_bid}
                onChange={(e) => setForm({ ...form, starting_bid: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Reserve Price ($)</label>
              <input
                type="number"
                disabled={form.is_no_reserve}
                step="500"
                value={form.reserve_price}
                onChange={(e) => setForm({ ...form, reserve_price: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 disabled:opacity-30"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-amber-400">
                <input
                  type="checkbox"
                  checked={form.is_no_reserve}
                  onChange={(e) => setForm({ ...form, is_no_reserve: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                No Reserve Auction
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Listing Description</label>
            <textarea
              rows={3}
              required
              placeholder="Provide vehicle history, ownership highlights, and recent maintenance..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Doug's Take (Enthusiast Editorial)</label>
            <textarea
              rows={2}
              placeholder="THIS is why this car is special..."
              value={form.dougs_take}
              onChange={(e) => setForm({ ...form, dougs_take: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" /> {loading ? 'Submitting to Auction...' : 'Publish Auction Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};
