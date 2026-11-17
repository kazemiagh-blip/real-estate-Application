import { Menu, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { User } from '../types';

export type ActivePage =
  | 'home'
  | 'listings'
  | 'property'
  | 'customer-dashboard'
  | 'agent-dashboard'
  | 'admin-dashboard';

interface NavbarProps {
  activePage: ActivePage;
  user: User | null;
  onNavigateHome: () => void;
  onNavigateBuy: () => void;
  onNavigateRent: () => void;
  onOpenSell: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
}

export function Navbar({
  activePage,
  user,
  onNavigateHome,
  onNavigateBuy,
  onNavigateRent,
  onOpenSell,
  onScrollToSection,
  onOpenAuth,
  onOpenDashboard,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardLabel =
    user?.role === 'admin'
      ? 'Admin Console'
      : user?.role === 'agent'
      ? 'Agent Portal'
      : 'My Account';

  const handleMobileAction = (fn: () => void) => {
    setMobileOpen(false);
    fn();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="text-xl font-semibold tracking-tight text-[#0B1528] font-editorial whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] rounded"
        >
          Prime Estate
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={onNavigateBuy}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              activePage === 'listings'
                ? 'border-[#B68D40] text-[#0B1528]'
                : 'border-transparent hover:text-[#0B1528] hover:border-slate-300'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={onNavigateRent}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#0B1528] hover:border-slate-300 transition-colors"
          >
            Rent
          </button>
          <button
            type="button"
            onClick={onOpenSell}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#0B1528] hover:border-slate-300 transition-colors"
          >
            Sell
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('locations-section')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#0B1528] hover:border-slate-300 transition-colors"
          >
            Locations
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('agents-section')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#0B1528] hover:border-slate-300 transition-colors"
          >
            Agents
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0B1528] hover:bg-[#13223D] rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              <UserIcon className="w-4 h-4 text-[#C9A254]" />
              <span className="truncate max-w-[140px]">{dashboardLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0B1528] hover:bg-[#13223D] rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 text-[#0B1528]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleMobileAction(onNavigateBuy)}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#0B1528] hover:bg-slate-50 rounded-md"
          >
            Buy Properties
          </button>
          <button
            type="button"
            onClick={() => handleMobileAction(onNavigateRent)}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#0B1528] hover:bg-slate-50 rounded-md"
          >
            Rent Properties
          </button>
          <button
            type="button"
            onClick={() => handleMobileAction(onOpenSell)}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#0B1528] hover:bg-slate-50 rounded-md"
          >
            Sell With Prime Estate
          </button>
          <button
            type="button"
            onClick={() => handleMobileAction(() => onScrollToSection('locations-section'))}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#0B1528] hover:bg-slate-50 rounded-md"
          >
            UAE Locations
          </button>
          <button
            type="button"
            onClick={() => handleMobileAction(() => onScrollToSection('agents-section'))}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#0B1528] hover:bg-slate-50 rounded-md"
          >
            Advisors & Agents
          </button>
        </div>
      )}
    </header>
  );
}
