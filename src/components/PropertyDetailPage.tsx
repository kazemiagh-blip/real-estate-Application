import {
  ArrowLeft,
  Bath,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiFetch } from '../lib/api';
import { buildWhatsAppUrl, formatAed, formatNumber } from '../lib/format';
import type { AgentPublic, Property } from '../types';
import { PropertyCard, type PropertyWithAgent } from './PropertyCard';
import { PropertyImage } from './PropertyImage';

interface PropertyDetailPageProps {
  propertyId: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onOpenProperty: (id: string) => void;
}

export function PropertyDetailPage({
  propertyId,
  favorites,
  onToggleFavorite,
  onBack,
  onOpenProperty,
}: PropertyDetailPageProps) {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<AgentPublic | null>(null);
  const [similar, setSimilar] = useState<PropertyWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Viewing request state
  const [viewingDate, setViewingDate] = useState('2026-11-24');
  const [viewingTime, setViewingTime] = useState('16:00');
  const [viewingMode, setViewingMode] = useState<'In-Person' | 'Live Video'>('In-Person');
  const [vName, setVName] = useState(user?.name || '');
  const [vEmail, setVEmail] = useState(user?.email || '');
  const [vPhone, setVPhone] = useState(user?.phone || '+971 50 ');
  const [vNotes, setVNotes] = useState('');
  const [viewingSending, setViewingSending] = useState(false);
  const [viewingSent, setViewingSent] = useState(false);
  const [viewingError, setViewingError] = useState('');

  // Direct inquiry state
  const [iName, setIName] = useState(user?.name || '');
  const [iEmail, setIEmail] = useState(user?.email || '');
  const [iPhone, setIPhone] = useState(user?.phone || '+971 50 ');
  const [iMessage, setIMessage] = useState('');
  const [inqSending, setInqSending] = useState(false);
  const [inqSent, setInqSent] = useState(false);
  const [inqError, setInqError] = useState('');

  useEffect(() => {
    if (user) {
      setVName((prev) => prev || user.name);
      setVEmail((prev) => prev || user.email);
      setVPhone((prev) => (prev === '+971 50 ' ? user.phone : prev));
      setIName((prev) => prev || user.name);
      setIEmail((prev) => prev || user.email);
      setIPhone((prev) => (prev === '+971 50 ' ? user.phone : prev));
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setActiveImgIdx(0);
    setViewingSent(false);
    setInqSent(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    apiFetch<{ property: Property; agent: AgentPublic | null; similar: PropertyWithAgent[] }>(
      `/api/properties/${propertyId}`
    )
      .then((data) => {
        if (!active) return;
        setProperty(data.property);
        setAgent(data.agent);
        setSimilar(data.similar);
        setIMessage(
          `Hello, I am interested in ${data.property.title} (Ref: ${data.property.referenceNumber}). Please share additional details.`
        );
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load property.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertyId]);

  const handleRequestViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setViewingSending(true);
    setViewingError('');
    try {
      await apiFetch('/api/viewings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          preferredDate: viewingDate,
          preferredTime: viewingTime,
          mode: viewingMode,
          name: vName,
          email: vEmail,
          phone: vPhone,
          notes: vNotes,
        }),
      });
      setViewingSent(true);
      setVNotes('');
    } catch (err) {
      setViewingError(
        err instanceof ApiError ? err.message : 'Unable to schedule viewing.'
      );
    } finally {
      setViewingSending(false);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setInqSending(true);
    setInqError('');
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'property_inquiry',
          propertyId: property.id,
          name: iName,
          email: iEmail,
          phone: iPhone,
          message: iMessage,
        }),
      });
      setInqSent(true);
    } catch (err) {
      setInqError(err instanceof ApiError ? err.message : 'Unable to send inquiry.');
    } finally {
      setInqSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="aspect-[16/9] max-h-[520px] w-full bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#0B1528]">Property Unavailable</h2>
        <p className="text-sm text-slate-600">{error || 'This listing could not be found.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-[#0B1528] text-white text-sm font-medium rounded-md"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const images = property.images.length > 0 ? property.images : [''];
  const isFav = favorites.includes(property.id);
  const pricePerSqFt = Math.round(property.priceAed / Math.max(1, property.sizeSqFt));
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.coordinates.lat},${property.coordinates.lng}`;
  const whatsappHref = buildWhatsAppUrl(
    agent?.whatsapp || '971504827710',
    `Hello ${agent?.name || 'Prime Estate'}, I am inquiring about "${property.title}" (Ref: ${property.referenceNumber}) listed at ${formatAed(property.priceAed, property.purpose)}.`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0B1528]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">
            Ref: {property.referenceNumber}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(property.id)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 bg-white hover:border-[#B68D40] rounded-md text-xs font-medium text-[#0B1528] transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                isFav ? 'fill-[#B68D40] text-[#B68D40]' : 'text-[#0B1528]'
              }`}
            />
            {isFav ? 'Saved' : 'Save Property'}
          </button>
        </div>
      </div>

      {/* Large Image Gallery */}
      <div className="space-y-3 mb-10">
        <div className="relative aspect-[16/9] max-h-[540px] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <PropertyImage
            src={images[activeImgIdx]}
            alt={`${property.title} — Photo ${activeImgIdx + 1}`}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActiveImgIdx((i) => (i - 1 + images.length) % images.length)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#0B1528] flex items-center justify-center shadow hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => setActiveImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#0B1528] flex items-center justify-center shadow hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-[#0B1528]/80 text-white text-xs font-mono rounded tabular-nums">
                {activeImgIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setActiveImgIdx(idx)}
                className={`relative w-28 aspect-[4/3] rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                  idx === activeImgIdx ? 'border-[#B68D40]' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <PropertyImage
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 8 Columns: Details, Specs, Features, Location Map */}
        <div className="lg:col-span-8 space-y-10">
          {/* Summary Header */}
          <div className="pb-8 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[#99732C]">
                {property.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{property.type}</span>
              <span aria-hidden="true">·</span>
              <span>{property.completion}</span>
              <span aria-hidden="true">·</span>
              <span>{property.furnished}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">RERA Permit {property.reraPermit}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-semibold text-[#0B1528] leading-tight">
                  {property.title}
                </h1>
                <p className="inline-flex items-center gap-1.5 text-sm text-slate-600 mt-2">
                  <MapPin className="w-4 h-4 text-[#99732C] shrink-0" />
                  {property.address}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-semibold text-[#0B1528] font-mono tabular-nums">
                  {formatAed(property.priceAed, property.purpose)}
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                  AED {formatNumber(pricePerSqFt)} / sq.ft
                </div>
              </div>
            </div>

            {/* Key Specifications Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Bedrooms</div>
                <div className="text-lg font-semibold text-[#0B1528] tabular-nums flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#99732C]" />
                  {property.bedrooms === 0 ? 'Commercial' : property.bedrooms}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Bathrooms</div>
                <div className="text-lg font-semibold text-[#0B1528] tabular-nums flex items-center gap-2">
                  <Bath className="w-4 h-4 text-[#99732C]" />
                  {property.bathrooms || '—'}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Total Area</div>
                <div className="text-lg font-semibold text-[#0B1528] tabular-nums flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-[#99732C]" />
                  {formatNumber(property.sizeSqFt)} sq.ft
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Reference</div>
                <div className="text-sm font-semibold text-[#0B1528] font-mono mt-1">
                  {property.referenceNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0B1528]">
              Property Overview
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </section>

          {/* Features & Amenities */}
          <section className="space-y-4 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-[#0B1528]">
              Features & Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.features.map((feat) => (
                <div
                  key={feat}
                  className="flex items-center gap-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-md px-4 py-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#99732C] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Location & Google Maps Link Panel */}
          <section className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#0B1528]">
                  Location & Community Context
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {property.community}, {property.emirate}
                </p>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1528] hover:bg-[#13223D] text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Open in Google Maps
                <ExternalLink className="w-3.5 h-3.5 text-[#C9A254]" />
              </a>
            </div>

            {/* Clean Architectural UAE Coordinate Map View */}
            <div className="bg-[#0B1528] text-white rounded-xl border border-slate-800 p-6 relative overflow-hidden">
              <svg
                viewBox="0 0 800 300"
                className="w-full h-56 rounded-lg bg-[#0F1D36] border border-slate-700/60"
                aria-label={`Location coordinate plot for ${property.location}`}
              >
                {/* Architectural Grid */}
                <defs>
                  <pattern id="uae-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="800" height="300" fill="url(#uae-grid)" />
                {/* Stylized Arabian Gulf Coastline Curve */}
                <path
                  d="M0,90 C160,115 260,70 420,105 C560,135 680,85 800,110 L800,0 L0,0 Z"
                  fill="rgba(30,51,88,0.55)"
                />
                <path
                  d="M0,90 C160,115 260,70 420,105 C560,135 680,85 800,110"
                  fill="none"
                  stroke="#C9A254"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
                {/* Sheikh Zayed Road Corridor */}
                <path
                  d="M40,245 L760,155"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
                <text x="590" y="160" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="monospace">
                  E11 SHEIKH ZAYED CORRIDOR
                </text>

                {/* Active Property Pin */}
                <g transform="translate(400, 155)">
                  <circle r="24" fill="rgba(201,162,84,0.22)" />
                  <circle r="9" fill="#C9A254" stroke="#FFFFFF" strokeWidth="2.5" />
                  <rect
                    x="-110"
                    y="-54"
                    width="220"
                    height="32"
                    rx="6"
                    fill="#0B1528"
                    stroke="#C9A254"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-34"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {property.location} · {property.emirate}
                  </text>
                </g>
              </svg>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
                <div className="font-mono tabular-nums">
                  GPS: {property.coordinates.lat.toFixed(4)}° N, {property.coordinates.lng.toFixed(4)}° E
                </div>
                <div>
                  Direct road access · Verified DLD / DMT Community Coordinates
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Agent Card + Request Viewing Form + Direct Inquiry */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Agent Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <PropertyImage
                src={agent?.avatar}
                alt={agent?.name || 'Prime Estate Advisor'}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-mono text-[#99732C]">
                  {agent?.reraId || 'BRN-44891'}
                </div>
                <h3 className="text-base font-semibold text-[#0B1528] font-sans truncate">
                  {agent?.name || 'Prime Estate Advisory'}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {agent?.agencyTitle || 'Senior Property Director'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${(agent?.phone || '+97143889100').replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0B1528] hover:bg-[#13223D] text-white text-xs font-medium rounded-md transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Agent
              </a>
            </div>

            {/* Direct Inquiry Form */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-[#0B1528] mb-3">
                Contact Agent
              </h4>
              {inqSent ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold">Inquiry Sent to {agent?.name || 'Advisor'}</div>
                  <p>Your inquiry has been logged in your history and assigned for immediate follow-up.</p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  {inqError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
                      {inqError}
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={iName}
                    onChange={(e) => setIName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <input
                    type="email"
                    required
                    value={iEmail}
                    onChange={(e) => setIEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <input
                    type="tel"
                    required
                    value={iPhone}
                    onChange={(e) => setIPhone(e.target.value)}
                    placeholder="+971 50 ..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <textarea
                    rows={3}
                    required
                    value={iMessage}
                    onChange={(e) => setIMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <button
                    type="submit"
                    disabled={inqSending}
                    className="w-full py-2.5 px-4 bg-[#B68D40] hover:bg-[#99732C] disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    {inqSending ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Request a Viewing Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#99732C]" />
              <h3 className="text-base font-semibold text-[#0B1528] font-sans">
                Request a Private Viewing
              </h3>
            </div>

            {viewingSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-1.5">
                <div className="font-semibold">Viewing Request Confirmed in Queue</div>
                <p>
                  Requested for <span className="font-mono">{viewingDate}</span> at{' '}
                  <span className="font-mono">{viewingTime}</span> ({viewingMode}).
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestViewing} className="space-y-3">
                {viewingError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
                    {viewingError}
                  </div>
                )}

                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-md">
                  {(['In-Person', 'Live Video'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setViewingMode(m)}
                      className={`py-1.5 text-xs font-medium rounded transition-colors ${
                        viewingMode === m
                          ? 'bg-[#0B1528] text-white'
                          : 'text-slate-600 hover:text-[#0B1528]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Time (GST)
                    </label>
                    <select
                      value={viewingTime}
                      onChange={(e) => setViewingTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md bg-white tabular-nums"
                    >
                      {['10:00', '11:30', '14:00', '16:00', '17:30', '19:00'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
                <input
                  type="email"
                  required
                  value={vEmail}
                  onChange={(e) => setVEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
                <input
                  type="tel"
                  required
                  value={vPhone}
                  onChange={(e) => setVPhone(e.target.value)}
                  placeholder="+971 50 ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
                <textarea
                  rows={2}
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  placeholder="Optional notes (valet, floor plans, mortgage pre-approval)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />

                <button
                  type="submit"
                  disabled={viewingSending}
                  className="w-full py-2.5 px-4 bg-[#0B1528] hover:bg-[#13223D] disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors"
                >
                  {viewingSending ? 'Scheduling...' : 'Book Viewing Appointment'}
                </button>
              </form>
            )}

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#99732C] shrink-0" />
              <span>RERA Verified Listing · Instant Advisor Confirmation</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar Properties */}
      {similar.length > 0 && (
        <section className="mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-2xl font-semibold text-[#0B1528] mb-8">
            Similar UAE Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map((item) => (
              <PropertyCard
                key={item.id}
                property={item}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpenProperty}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
