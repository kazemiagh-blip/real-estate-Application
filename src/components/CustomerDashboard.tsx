import { Bookmark, Calendar, Heart, LogOut, MessageSquare, Search, Trash2, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { formatDate } from '../lib/format';
import type { Inquiry, PropertyFilters, ViewingRequest } from '../types';
import { PropertyCard, type PropertyWithAgent } from './PropertyCard';

interface CustomerDashboardProps {
  onOpenProperty: (id: string) => void;
  onApplySavedSearch: (filters: PropertyFilters) => void;
  onLoggedOut: () => void;
}

type CustomerTab = 'favorites' | 'searches' | 'viewings' | 'inquiries' | 'profile';

export function CustomerDashboard({
  onOpenProperty,
  onApplySavedSearch,
  onLoggedOut,
}: CustomerDashboardProps) {
  const { user, toggleFavorite, deleteSavedSearch, updateProfile, logout } = useAuth();
  const [tab, setTab] = useState<CustomerTab>('favorites');
  const [favoriteProps, setFavoriteProps] = useState<PropertyWithAgent[]>([]);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfilePhone(user.phone);
  }, [user]);

  const loadCustomerData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const favIds = user.favorites;
      const [propsRes, viewRes, inqRes] = await Promise.all([
        favIds.length > 0
          ? apiFetch<{ properties: PropertyWithAgent[] }>(
              `/api/properties?ids=${encodeURIComponent(favIds.join(','))}`
            )
          : Promise.resolve({ properties: [] }),
        apiFetch<{ viewings: ViewingRequest[] }>('/api/viewings'),
        apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries'),
      ]);
      setFavoriteProps(propsRes.properties);
      setViewings(viewRes.viewings);
      setInquiries(inqRes.inquiries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [user?.favorites.length]);

  if (!user) return null;

  const handleCancelViewing = async (viewingId: string) => {
    const res = await apiFetch<{ viewing: ViewingRequest }>(`/api/viewings/${viewingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setViewings((prev) => prev.map((v) => (v.id === viewingId ? res.viewing : v)));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name: profileName, phone: profilePhone });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    onLoggedOut();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#99732C]">
            Client Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1528] mt-1">
            Welcome, {user.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:border-[#0B1528] rounded-md text-xs font-medium text-[#0B1528] self-start"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-6 mb-8 border-b border-slate-200">
        {[
          { id: 'favorites' as const, label: `Saved Properties (${user.favorites.length})`, icon: Heart },
          { id: 'searches' as const, label: `Saved Searches (${user.savedSearches.length})`, icon: Bookmark },
          { id: 'viewings' as const, label: `Viewing Requests (${viewings.length})`, icon: Calendar },
          { id: 'inquiries' as const, label: `Inquiry History (${inquiries.length})`, icon: MessageSquare },
          { id: 'profile' as const, label: 'Personal Profile', icon: UserIcon },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-[#0B1528] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'favorites' && (
        <div>
          {loading ? (
            <div className="text-sm text-slate-500 py-8">Loading saved properties...</div>
          ) : favoriteProps.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <h2 className="text-lg font-semibold text-[#0B1528]">No Saved Properties Yet</h2>
              <p className="text-sm text-slate-600">
                Click the heart icon on any listing to curate your shortlist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProps.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isFavorite={user.favorites.includes(prop.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpen={onOpenProperty}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'searches' && (
        <div className="space-y-4">
          {user.savedSearches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
              <h2 className="text-lg font-semibold text-[#0B1528]">No Saved Searches</h2>
              <p className="text-sm text-slate-600">
                Use the Save Search button on the property search page to revisit filter sets with one click.
              </p>
            </div>
          ) : (
            user.savedSearches.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-[#0B1528] font-sans">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Saved {formatDate(s.createdAt)} · Purpose: {s.filters.purpose || 'All'}
                    {s.filters.location ? ` · Location: ${s.filters.location}` : ''}
                    {s.filters.bedrooms && s.filters.bedrooms !== 'All'
                      ? ` · ${s.filters.bedrooms}+ Beds`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onApplySavedSearch(s.filters)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1528] hover:bg-[#13223D] text-white text-xs font-medium rounded-md"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Run Search
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavedSearch(s.id)}
                    aria-label="Delete saved search"
                    className="p-2 border border-slate-200 rounded-md text-slate-500 hover:text-red-600 hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'viewings' && (
        <div className="space-y-4">
          {viewings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
              <h2 className="text-lg font-semibold text-[#0B1528]">No Viewing Appointments</h2>
              <p className="text-sm text-slate-600">
                Schedule an in-person or live video tour from any property detail page.
              </p>
            </div>
          ) : (
            viewings.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-[#0B1528]">{v.propertyRef}</span>
                    <span aria-hidden="true">·</span>
                    <span>{v.mode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold capitalize text-[#99732C]">
                      Status: {v.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProperty(v.propertyId)}
                    className="text-base font-semibold text-[#0B1528] hover:text-[#99732C] text-left"
                  >
                    {v.propertyTitle}
                  </button>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Scheduled: {v.preferredDate} at {v.preferredTime} GST · Advisor: {v.agentName}
                  </p>
                  {v.agentNote && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 mt-2">
                      Advisor Note: {v.agentNote}
                    </p>
                  )}
                </div>

                {v.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleCancelViewing(v.id)}
                    className="px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium rounded-md self-start md:self-center whitespace-nowrap"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'inquiries' && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
              <h2 className="text-lg font-semibold text-[#0B1528]">No Inquiry History</h2>
              <p className="text-sm text-slate-600">
                Messages sent to advisors regarding listings or property valuations appear here.
              </p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0B1528]">
                      {inq.propertyTitle || 'Private Valuation / Advisory Request'}
                    </span>
                    {inq.propertyRef && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{inq.propertyRef}</span>
                      </>
                    )}
                  </div>
                  <span className="capitalize font-medium text-[#99732C]">
                    Status: {inq.status} · {formatDate(inq.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{inq.message}</p>
                {inq.agentNote && (
                  <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                    Advisor Response: {inq.agentNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-slate-200 rounded-lg p-6 max-w-lg space-y-4"
        >
          <h2 className="text-lg font-semibold text-[#0B1528]">Personal Profile</h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0B1528] hover:bg-[#13223D] text-white text-sm font-medium rounded-md"
            >
              Save Profile
            </button>
            {profileSaved && (
              <span className="text-xs font-medium text-emerald-700">Profile updated</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
