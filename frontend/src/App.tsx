import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { CreateListingModal } from './components/CreateListingModal';
import { Car, ShieldAlert, Cpu, Tag, GitCommit } from 'lucide-react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const RELEASE_TAG = import.meta.env.VITE_RELEASE_TAG || `v${APP_VERSION}`;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || '';
const DEPLOY_ENV = import.meta.env.VITE_ENV || 'production';

export const AppContent: React.FC = () => {
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [createListingOpen, setCreateListingOpen] = useState<boolean>(false);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      <div>
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAuth={handleOpenAuth}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenCreateListing={() => setCreateListingOpen(true)}
          onHomeClick={() => setSelectedAuctionId(null)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {selectedAuctionId !== null ? (
            <AuctionDetailPage
              auctionId={selectedAuctionId}
              onBack={() => setSelectedAuctionId(null)}
              onOpenAuth={handleOpenAuth}
            />
          ) : (
            <HomePage
              searchQuery={searchQuery}
              onSelectAuction={(id) => setSelectedAuctionId(id)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-200">GearBids Microservices Platform</p>
                <p className="text-[11px] text-slate-500">Cloud-Native EC2 Architecture | Evaluator Edition</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Cpu className="w-4 h-4" /> 4 Microservices
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldAlert className="w-4 h-4 text-emerald-400" /> AWS SSM EC2
              </span>
              <div className="flex items-center gap-2 border border-slate-700/70 rounded-full px-3 py-1 bg-slate-900/90 text-[11px] font-mono shadow-sm">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-100 font-semibold">{RELEASE_TAG}</span>
                {GIT_COMMIT && (
                  <span className="flex items-center gap-1 text-slate-400 border-l border-slate-700/80 pl-2">
                    <GitCommit className="w-3 h-3 text-slate-400" />
                    {GIT_COMMIT.slice(0, 7)}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-800/40">
                  {DEPLOY_ENV}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectAuction={(id) => setSelectedAuctionId(id)}
      />

      <CreateListingModal
        isOpen={createListingOpen}
        onClose={() => setCreateListingOpen(false)}
        onCreated={(newAuction) => setSelectedAuctionId(newAuction.id)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
