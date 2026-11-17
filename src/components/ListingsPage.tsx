import { BookmarkPlus, Check, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { UAE_COMMUNITIES } from '../lib/format';
import type { PropertyFilters } from '../types';
import { PropertyCard, type PropertyWithAgent } from './PropertyCard';

interface ListingsPageProps {
  initialFilters: PropertyFilters;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenProperty: (id: string) => void;
  onOpenAuth: () => void;
}

const PROPERTY_TYPES = [
  'All',
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Commercial',
  'Office',
  'Land',
];

export function ListingsPage({
  initialFilters,
  favorites,
  onToggleFavorite,
  onOpenProperty,
  onOpenAuth,
}: ListingsPageProps) {
  const { user, saveSearch } = useAuth();
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [properties, setProperties] = useState<PropertyWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [savingSearch, setSavingSearch] = useState(false);
  const [searchSavedMsg, setSearchSavedMsg] = useState('');

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    let active = true;
    const fetchListings = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filters.q) params.set('q', filters.q);
        if (filters.purpose && filters.purpose !== 'All') params.set('purpose', filters.purpose);
        if (filters.type && filters.type !== 'All') params.set('type', filters.type);
        if (filters.location) params.set('location', filters.location);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.bedrooms && filters.bedrooms !== 'All') params.set('bedrooms', filters.bedrooms);
        if (filters.bathrooms && filters.bathrooms !== 'All') params.set('bathrooms', filters.bathrooms);
        if (filters.minSize) params.set('minSize', filters.minSize);
        if (filters.maxSize) params.set('maxSize', filters.maxSize);
        if (filters.furnished && filters.furnished !== 'All') params.set('furnished', filters.furnished);
        if (filters.completion && filters.completion !== 'All') params.set('completion', filters.completion);
        if (filters.agentId) params.set('agentId', filters.agentId);
        if (filters.sort) params.set('sort', filters.sort);

        const data = await apiFetch<{ properties: PropertyWithAgent[] }>(
          `/api/properties?${params.toString()}`
        );
        if (active) setProperties(data.properties);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load properties.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchListings();
    return () => {
      active = false;
    };
  }, [filters]);

  const updateFilter = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSearchSavedMsg('');
  };

  const resetFilters = () => {
    setFilters({ purpose: 'All', type: 'All', sort: 'newest' });
    setSearchSavedMsg('');
  };

  const handleSaveSearch = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setSavingSearch(true);
    try {
      const parts = [
        filters.purpose && filters.purpose !== 'All' ? filters.purpose : 'All',
        filters.type && filters.type !== 'All' ? filters.type : 'Properties',
        filters.location || 'UAE',
      ];
      await saveSearch(parts.join(' · '), filters);
      setSearchSavedMsg('Search saved to your account');
    } finally {
      setSavingSearch(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#99732C] mb-1">
            UAE Property Search
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1528]">
            {filters.purpose === 'Buy'
              ? 'Properties for Sale in the UAE'
              : filters.purpose === 'Rent'
              ? 'Properties for Rent in the UAE'
              : 'All Verified UAE Properties'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 tabular-nums">
            Showing {properties.length} {properties.length === 1 ? 'listing' : 'listings'}
            {filters.location ? ` in ${filters.location}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFiltersMobile((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-md text-xs font-medium text-[#0B1528]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFiltersMobile ? 'Hide Filters' : 'Filters'}
          </button>

          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={savingSearch}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:border-[#B68D40] rounded-md text-xs font-medium text-[#0B1528] transition-colors whitespace-nowrap"
          >
            {searchSavedMsg ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                {searchSavedMsg}
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-[#99732C]" />
                {savingSearch ? 'Saving...' : 'Save Search'}
              </>
            )}
          </button>

          <select
            aria-label="Sort properties"
            value={filters.sort || 'newest'}
            onChange={(e) =>
              updateFilter('sort', e.target.value as PropertyFilters['sort'])
            }
            className="px-3.5 py-2 border border-slate-300 bg-white rounded-md text-xs font-medium text-[#0B1528] focus:outline-none focus:border-[#0B1528]"
          >
            <option value="newest">Sort: Newest Listings</option>
            <option value="popular">Sort: Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Advanced Filter Sidebar */}
        <aside
          className={`lg:col-span-3 bg-white border border-slate-200 rounded-lg p-5 space-y-5 ${
            showFiltersMobile ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-[#0B1528] font-sans">
              Search & Filter Criteria
            </h2>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0B1528]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Keyword or Ref #
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.q || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="Pool, Burj, PE-DXB..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-md">
              {(['All', 'Buy', 'Rent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateFilter('purpose', p)}
                  className={`py-1.5 text-xs font-medium rounded transition-colors ${
                    (filters.purpose || 'All') === p
                      ? 'bg-[#0B1528] text-white'
                      : 'text-slate-600 hover:text-[#0B1528]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Location & Community
            </label>
            <select
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="">All UAE Communities</option>
              {UAE_COMMUNITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Property Type
            </label>
            <select
              value={filters.type || 'All'}
              onChange={(e) =>
                updateFilter('type', e.target.value as PropertyFilters['type'])
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Property Types' : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Price Range (AED)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                placeholder="Min AED"
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md tabular-nums"
              />
              <input
                type="number"
                min="0"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                placeholder="Max AED"
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms || 'All'}
                onChange={(e) => updateFilter('bedrooms', e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="All">Any</option>
                <option value="0">Studio / Commercial</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bathrooms
              </label>
              <select
                value={filters.bathrooms || 'All'}
                onChange={(e) => updateFilter('bathrooms', e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="All">Any</option>
                <option value="1">1+ Bath</option>
                <option value="2">2+ Baths</option>
                <option value="3">3+ Baths</option>
                <option value="4">4+ Baths</option>
                <option value="5">5+ Baths</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Area Size (sq.ft)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={filters.minSize || ''}
                onChange={(e) => updateFilter('minSize', e.target.value)}
                placeholder="Min sq.ft"
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md tabular-nums"
              />
              <input
                type="number"
                min="0"
                value={filters.maxSize || ''}
                onChange={(e) => updateFilter('maxSize', e.target.value)}
                placeholder="Max sq.ft"
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Furnishing
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-md">
              {(['All', 'Furnished', 'Unfurnished'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => updateFilter('furnished', f)}
                  className={`py-1.5 text-[11px] font-medium rounded transition-colors ${
                    (filters.furnished || 'All') === f
                      ? 'bg-[#0B1528] text-white'
                      : 'text-slate-600 hover:text-[#0B1528]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Completion Status
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-md">
              {(['All', 'Ready', 'Off-Plan'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateFilter('completion', c)}
                  className={`py-1.5 text-[11px] font-medium rounded transition-colors ${
                    (filters.completion || 'All') === c
                      ? 'bg-[#0B1528] text-white'
                      : 'text-slate-600 hover:text-[#0B1528]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-5 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4">
              <h3 className="text-lg font-semibold text-[#0B1528]">
                No Properties Match Your Selected Criteria
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Try adjusting your price range, bedroom minimum, or community filter to view more curated UAE listings.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 bg-[#0B1528] text-white text-sm font-medium rounded-md hover:bg-[#13223D]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isFavorite={favorites.includes(prop.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpen={onOpenProperty}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
