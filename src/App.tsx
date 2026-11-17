import { MotionConfig } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { ListingsPage } from './components/ListingsPage';
import { Navbar, type ActivePage } from './components/Navbar';
import { type PropertyWithAgent } from './components/PropertyCard';
import { PropertyDetailPage } from './components/PropertyDetailPage';
import { SellPropertyModal } from './components/SellPropertyModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './lib/api';
import type { AgentPublic, PropertyFilters, SiteContent } from './types';

const DEFAULT_CONTENT: SiteContent = {
  heroHeadline: 'Architectural Residences Across Dubai & the Emirates',
  heroSubheadline:
    'Private advisory for waterfront villas, trophy penthouses, and institutional commercial real estate across the UAE.',
  featuredBannerTitle: 'Curated Portfolio · Palm Jumeirah, Downtown Dubai & DIFC',
  marketBrief:
    'Prime Dubai luxury transactions rose 24% year-on-year in 2026, led by Palm Jumeirah, Downtown Dubai, and DIFC Grade-A commercial demand.',
  companyPhone: '+971 4 388 9100',
  companyWhatsapp: '971504827710',
  companyEmail: 'advisory@primeestate.ae',
  officeAddress: 'Suite 2404, Boulevard Plaza Tower 1, Downtown Dubai, UAE',
  reraBrokerageId: 'ORN-28419',
};

function PrimeEstateApp() {
  const { user, toggleFavorite } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [listingFilters, setListingFilters] = useState<PropertyFilters>({
    purpose: 'All',
    sort: 'newest',
  });

  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [featuredProperties, setFeaturedProperties] = useState<PropertyWithAgent[]>([]);
  const [latestProperties, setLatestProperties] = useState<PropertyWithAgent[]>([]);
  const [agents, setAgents] = useState<AgentPublic[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      const [contentRes, featRes, latestRes, agentRes] = await Promise.all([
        apiFetch<{ content: SiteContent }>('/api/content'),
        apiFetch<{ properties: PropertyWithAgent[] }>('/api/properties?featured=true&sort=popular'),
        apiFetch<{ properties: PropertyWithAgent[] }>('/api/properties?sort=newest'),
        apiFetch<{ agents: AgentPublic[] }>('/api/agents'),
      ]);
      setSiteContent(contentRes.content);
      setFeaturedProperties(featRes.properties);
      setLatestProperties(latestRes.properties);
      setAgents(agentRes.agents);
    } catch (err) {
      console.error('Failed to load initial Prime Estate data:', err);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const navigateHome = () => {
    setActivePage('home');
    loadHomeData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateListings = (filters: PropertyFilters) => {
    setListingFilters(filters);
    setActivePage('listings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProperty = (id: string) => {
    setSelectedPropertyId(id);
    setActivePage('property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDashboardForRole = (role?: 'customer' | 'agent' | 'admin') => {
    const r = role || user?.role;
    if (r === 'admin') setActivePage('admin-dashboard');
    else if (r === 'agent') setActivePage('agent-dashboard');
    else setActivePage('customer-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    await toggleFavorite(propertyId);
  };

  const scrollToHomeSection = (sectionId: string) => {
    if (activePage !== 'home') {
      setActivePage('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const favorites = user?.favorites || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activePage={activePage}
        user={user}
        onNavigateHome={navigateHome}
        onNavigateBuy={() => navigateListings({ purpose: 'Buy', sort: 'newest' })}
        onNavigateRent={() => navigateListings({ purpose: 'Rent', sort: 'newest' })}
        onOpenSell={() => setSellModalOpen(true)}
        onScrollToSection={scrollToHomeSection}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDashboard={() => openDashboardForRole()}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            siteContent={siteContent}
            featuredProperties={featuredProperties}
            latestProperties={latestProperties}
            agents={agents}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenProperty={openProperty}
            onSearchListings={navigateListings}
            onOpenSell={() => setSellModalOpen(true)}
          />
        )}

        {activePage === 'listings' && (
          <ListingsPage
            initialFilters={listingFilters}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenProperty={openProperty}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activePage === 'property' && selectedPropertyId && (
          <PropertyDetailPage
            propertyId={selectedPropertyId}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onBack={() => navigateListings(listingFilters)}
            onOpenProperty={openProperty}
          />
        )}

        {activePage === 'customer-dashboard' && (
          <CustomerDashboard
            onOpenProperty={openProperty}
            onApplySavedSearch={(filters) => navigateListings(filters)}
            onLoggedOut={navigateHome}
          />
        )}

        {activePage === 'agent-dashboard' && (
          <AgentDashboard
            onOpenProperty={openProperty}
            onLoggedOut={navigateHome}
          />
        )}

        {activePage === 'admin-dashboard' && (
          <AdminDashboard
            siteContent={siteContent}
            onSiteContentUpdated={(updated) => setSiteContent(updated)}
            onOpenProperty={openProperty}
            onLoggedOut={navigateHome}
          />
        )}
      </main>

      <Footer
        siteContent={siteContent}
        onNavigateBuy={() => navigateListings({ purpose: 'Buy', sort: 'newest' })}
        onNavigateRent={() => navigateListings({ purpose: 'Rent', sort: 'newest' })}
        onOpenSell={() => setSellModalOpen(true)}
        onFilterLocation={(loc) => navigateListings({ location: loc, purpose: 'All', sort: 'newest' })}
        onOpenAuth={() => (user ? openDashboardForRole() : setAuthModalOpen(true))}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(role) => openDashboardForRole(role)}
      />

      <SellPropertyModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <PrimeEstateApp />
      </AuthProvider>
    </MotionConfig>
  );
}
