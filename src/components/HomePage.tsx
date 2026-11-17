import { ArrowRight, MessageCircle, Phone, Search } from 'lucide-react';
import React, { useState } from 'react';
import { buildWhatsAppUrl, UAE_COMMUNITIES } from '../lib/format';
import type { AgentPublic, PropertyFilters, SiteContent } from '../types';
import { PropertyCard, type PropertyWithAgent } from './PropertyCard';
import { PropertyImage } from './PropertyImage';

interface HomePageProps {
  siteContent: SiteContent;
  featuredProperties: PropertyWithAgent[];
  latestProperties: PropertyWithAgent[];
  agents: AgentPublic[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenProperty: (id: string) => void;
  onSearchListings: (filters: PropertyFilters) => void;
  onOpenSell: () => void;
}

const POPULAR_LOCATIONS = [
  {
    name: 'Palm Jumeirah',
    emirate: 'Dubai',
    subtitle: 'Private frond villas & branded beachfront residences',
    image: '/src/assets/images/prop_palm_villa_1794929836368.jpg',
  },
  {
    name: 'Downtown Dubai',
    emirate: 'Dubai',
    subtitle: 'Burj Khalifa penthouses & Opera District residences',
    image: '/src/assets/images/prop_downtown_penthouse_1794929837008.jpg',
  },
  {
    name: 'Dubai Marina',
    emirate: 'Dubai',
    subtitle: 'Waterfront apartments overlooking superyacht berths',
    image: '/src/assets/images/prop_marina_apartment_1794929838106.jpg',
  },
  {
    name: 'Dubai Hills Estate',
    emirate: 'Dubai',
    subtitle: 'Golf-front villas & family park townhouses',
    image: '/src/assets/images/prop_hills_townhouse_1794929838495.jpg',
  },
  {
    name: 'DIFC',
    emirate: 'Dubai',
    subtitle: 'Grade-A financial suites & Gate Village offices',
    image: '/src/assets/images/prop_difc_office_1794929837691.jpg',
  },
  {
    name: 'Saadiyat Island',
    emirate: 'Abu Dhabi',
    subtitle: 'Cultural District coastal plots & beachfront estates',
    image: '/src/assets/images/hero_dubai_penthouse_1794929835668.jpg',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Prime Estate structured our Frond G villa acquisition from initial private viewing through DLD trustee transfer in 18 days with complete discretion.',
    author: 'Karim Al-Darwish',
    role: 'Managing Partner, Al-Darwish Family Office · Dubai',
    outcome: 'AED 34.5M Palm Jumeirah Acquisition',
  },
  {
    quote:
      'Their commercial team secured a fully fitted Gate Village office floor in DIFC ahead of market release, saving four months of fit-out lead time.',
    author: 'Claire Henderson',
    role: 'Regional COO, Meridian Capital Advisors · DIFC',
    outcome: '3,200 sq.ft. DIFC Headquarters Lease',
  },
  {
    quote:
      'As an overseas investor, having verified RERA documentation, video walkthroughs, and transparent yield modeling made purchasing in Creek Harbour effortless.',
    author: 'Dr. Fadi Mansour',
    role: 'Private Investor · Geneva & Abu Dhabi',
    outcome: '7.4% Projected Net Yield Portfolio',
  },
];

export function HomePage({
  siteContent,
  featuredProperties,
  latestProperties,
  agents,
  favorites,
  onToggleFavorite,
  onOpenProperty,
  onSearchListings,
  onOpenSell,
}: HomePageProps) {
  const [purposeTab, setPurposeTab] = useState<'Buy' | 'Rent' | 'Sell'>('Buy');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [bedrooms, setBedrooms] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purposeTab === 'Sell') {
      onOpenSell();
      return;
    }
    onSearchListings({
      purpose: purposeTab,
      location: location || undefined,
      type: propertyType === 'All' ? 'All' : (propertyType as PropertyFilters['type']),
      bedrooms,
      maxPrice: maxPrice || undefined,
      q: keyword || undefined,
      sort: 'newest',
    });
  };

  return (
    <div>
      {/* 1. HERO BANNER + SEARCH PROPERTIES */}
      <section className="relative bg-[#0B1528] text-white overflow-hidden">
        <div className="absolute inset-0">
          <PropertyImage
            src="/src/assets/images/hero_dubai_penthouse_1794929835668.jpg"
            alt="Luxury waterfront penthouse terrace overlooking Dubai skyline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/95 via-[#0B1528]/65 to-[#0B1528]/45" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-24">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs sm:text-sm font-medium tracking-wider uppercase text-[#C9A254]">
              Dubai · Abu Dhabi · RERA Licensed Advisory
            </p>
            <h1
              className="text-3xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.08] tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {siteContent.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              {siteContent.heroSubheadline}
            </p>
          </div>

          {/* Search Properties Console */}
          <div className="mt-10 bg-white text-slate-900 rounded-xl border border-slate-200/80 shadow-xl p-4 sm:p-6 max-w-5xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                {(['Buy', 'Rent', 'Sell'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPurposeTab(tab)}
                    className={`px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      purposeTab === tab
                        ? 'bg-[#0B1528] text-white'
                        : 'text-slate-600 hover:text-[#0B1528]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {purposeTab === 'Sell'
                  ? 'Receive a confidential market valuation from a senior RERA advisor'
                  : 'Search verified ready, off-plan, and commercial properties in AED'}
              </span>
            </div>

            {purposeTab === 'Sell' ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B1528] font-sans">
                    Considering selling or leasing your UAE property?
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Access institutional buyers, family offices, and DLD-benchmarked pricing strategy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenSell}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#B68D40] hover:bg-[#99732C] text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Request Private Valuation
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleHeroSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
              >
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Community or Reference
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Palm Jumeirah, Burj view, PE-DXB..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#0B1528]"
                  >
                    <option value="">All UAE</option>
                    {UAE_COMMUNITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#0B1528]"
                  >
                    <option value="All">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Office">Office</option>
                    <option value="Land">Land</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Bedrooms / Max AED
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-2 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#0B1528]"
                    >
                      <option value="All">Beds</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max AED"
                      className="w-full px-2.5 py-2.5 text-sm border border-slate-300 rounded-md tabular-nums focus:outline-none focus:border-[#0B1528]"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#B68D40] hover:bg-[#99732C] text-white text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Market Brief Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-slate-700">{siteContent.marketBrief}</p>
          <button
            type="button"
            onClick={() => onSearchListings({ purpose: 'All', sort: 'popular' })}
            className="text-sm font-medium text-[#0B1528] hover:text-[#99732C] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Explore All Properties
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1.5">
              Signature Collection
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
              {siteContent.featuredBannerTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSearchListings({ purpose: 'Buy', sort: 'price_desc' })}
            className="text-sm font-medium text-[#0B1528] hover:text-[#99732C] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            View Featured Portfolio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.slice(0, 3).map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavorite={favorites.includes(prop.id)}
              onToggleFavorite={onToggleFavorite}
              onOpen={onOpenProperty}
            />
          ))}
        </div>
      </section>

      {/* 3. POPULAR LOCATIONS IN DUBAI & THE UAE */}
      <section id="locations-section" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1.5">
                Emirates Coverage
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
                Popular Locations in Dubai & the UAE
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Select a community to filter verified residential and commercial opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POPULAR_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() =>
                  onSearchListings({
                    location: loc.name,
                    purpose: 'All',
                    sort: 'newest',
                  })
                }
                className="group relative aspect-[16/10] rounded-lg overflow-hidden text-left border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              >
                <PropertyImage
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/90 via-[#0B1528]/35 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="text-xs text-[#C9A254] font-medium mb-0.5">
                    {loc.emirate}
                  </div>
                  <h3 className="text-lg font-semibold font-sans">{loc.name}</h3>
                  <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                    {loc.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LATEST PROPERTY LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1.5">
              New to Market
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
              Latest Property Listings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSearchListings({ purpose: 'All', sort: 'newest' })}
            className="text-sm font-medium text-[#0B1528] hover:text-[#99732C] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            Browse All Listings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestProperties.slice(0, 6).map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavorite={favorites.includes(prop.id)}
              onToggleFavorite={onToggleFavorite}
              onOpen={onOpenProperty}
            />
          ))}
        </div>
      </section>

      {/* 5. TOP REAL ESTATE AGENTS */}
      <section id="agents-section" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1.5">
              RERA Certified Advisors
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
              Top Real Estate Agents
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Work directly with bilingual directors specializing in Dubai and Abu Dhabi prime enclaves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row gap-6 items-start"
              >
                <PropertyImage
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-24 h-24 rounded-lg object-cover shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-[#0B1528]">{agent.reraId}</span>
                    <span aria-hidden="true">·</span>
                    <span>{agent.languages.join(' / ')}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0B1528] font-sans">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-medium text-[#99732C]">
                    {agent.agencyTitle} · {agent.specialty}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {agent.bio}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onSearchListings({ agentId: agent.id, purpose: 'All', sort: 'newest' })
                      }
                      className="px-3.5 py-2 bg-[#0B1528] hover:bg-[#13223D] text-white text-xs font-medium rounded-md transition-colors tabular-nums"
                    >
                      View {agent.activeListingsCount} Listings
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        agent.whatsapp,
                        `Hello ${agent.name}, I would like to discuss UAE real estate opportunities with Prime Estate.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:border-[#0B1528] text-[#0B1528] text-xs font-medium rounded-md transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${agent.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:border-[#0B1528] text-[#0B1528] text-xs font-medium rounded-md transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CUSTOMER TESTIMONIALS & SELL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1.5">
            Client Outcomes
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
            Trusted by Private Buyers & Institutional Offices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.author}
              className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-5"
            >
              <p className="text-sm text-slate-700 leading-relaxed">
                “{item.quote}”
              </p>
              <footer className="pt-4 border-t border-slate-100">
                <div className="text-sm font-semibold text-[#0B1528]">
                  {item.author}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.role}</div>
                <div className="text-xs font-mono text-[#99732C] mt-1.5">
                  {item.outcome}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Sell / Private Advisory Banner */}
        <div className="bg-[#0B1528] text-white rounded-xl p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">
              Sell or Lease Your Property With Prime Estate
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Schedule a confidential comparative market analysis grounded in Dubai Land Department transactions and qualified private buyer demand.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSell}
            className="px-6 py-3 bg-[#B68D40] hover:bg-[#99732C] text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Request Property Valuation
          </button>
        </div>
      </section>
    </div>
  );
}
