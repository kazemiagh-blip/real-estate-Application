import {
  BarChart3,
  Building2,
  Check,
  Edit3,
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { formatAed, formatDate, formatNumber } from '../lib/format';
import type {
  AdminOverview,
  Inquiry,
  ListingStatus,
  Property,
  SiteContent,
  User,
  ViewingRequest,
} from '../types';
import { PropertyFormModal } from './PropertyFormModal';
import { PropertyImage } from './PropertyImage';

interface AdminUserRow extends User {
  listingsCount: number;
}

interface AdminDashboardProps {
  siteContent: SiteContent;
  onSiteContentUpdated: (content: SiteContent) => void;
  onOpenProperty: (id: string) => void;
  onLoggedOut: () => void;
}

type AdminTab = 'overview' | 'approvals' | 'properties' | 'users' | 'inquiries' | 'content';

export function AdminDashboard({
  siteContent,
  onSiteContentUpdated,
  onOpenProperty,
  onLoggedOut,
}: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  const [cms, setCms] = useState<SiteContent>(siteContent);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);

  useEffect(() => {
    setCms(siteContent);
  }, [siteContent]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ovRes, propRes, userRes, inqRes, viewRes] = await Promise.all([
        apiFetch<{ overview: AdminOverview }>('/api/admin/overview'),
        apiFetch<{ properties: Property[] }>('/api/properties?status=All'),
        apiFetch<{ users: AdminUserRow[] }>('/api/admin/users'),
        apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries'),
        apiFetch<{ viewings: ViewingRequest[] }>('/api/viewings'),
      ]);
      setOverview(ovRes.overview);
      setProperties(propRes.properties);
      setUsers(userRes.users);
      setInquiries(inqRes.inquiries);
      setViewings(viewRes.viewings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (!user || user.role !== 'admin') return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handlePropertyPatch = async (
    prop: Property,
    patch: Partial<{ status: ListingStatus; featured: boolean }>
  ) => {
    const res = await apiFetch<{ property: Property }>(`/api/properties/${prop.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setProperties((prev) => prev.map((p) => (p.id === prop.id ? res.property : p)));
    const ov = await apiFetch<{ overview: AdminOverview }>('/api/admin/overview');
    setOverview(ov.overview);
    showToast(`Updated ${prop.referenceNumber}`);
  };

  const handleDeleteProperty = async (prop: Property) => {
    await apiFetch(`/api/properties/${prop.id}`, { method: 'DELETE' });
    setProperties((prev) => prev.filter((p) => p.id !== prop.id));
    const ov = await apiFetch<{ overview: AdminOverview }>('/api/admin/overview');
    setOverview(ov.overview);
    showToast(`Removed ${prop.referenceNumber}`);
  };

  const handleUserPatch = async (
    row: AdminUserRow,
    patch: Partial<{ active: boolean; verified: boolean; role: User['role'] }>
  ) => {
    const res = await apiFetch<{ user: User }>(`/api/admin/users/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === row.id ? { ...u, ...res.user } : u))
    );
    showToast(`Updated account for ${row.name}`);
  };

  const handleInquiryStatus = async (inq: Inquiry, status: Inquiry['status']) => {
    const res = await apiFetch<{ inquiry: Inquiry }>(`/api/inquiries/${inq.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setInquiries((prev) => prev.map((i) => (i.id === inq.id ? res.inquiry : i)));
    showToast('Inquiry status updated');
  };

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch<{ content: SiteContent }>('/api/admin/content', {
      method: 'PATCH',
      body: JSON.stringify(cms),
    });
    onSiteContentUpdated(res.content);
    showToast('Website content published');
  };

  const pendingProperties = properties.filter((p) => p.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#99732C]">
            Executive Administration Console
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1528] mt-1">
            Prime Estate Platform Operations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage approvals, brokerage inventory, clients, agents, inquiries, and site content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingProp(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B68D40] hover:bg-[#99732C] text-white text-xs sm:text-sm font-medium rounded-md"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              onLoggedOut();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:border-[#0B1528] rounded-md text-xs font-medium text-[#0B1528]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium rounded-md">
          {feedback}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-6 mb-8 border-b border-slate-200">
        {[
          { id: 'overview' as const, label: 'Executive Overview', icon: BarChart3 },
          { id: 'approvals' as const, label: `Pending Approvals (${pendingProperties.length})`, icon: ShieldCheck },
          { id: 'properties' as const, label: `All Properties (${properties.length})`, icon: Building2 },
          { id: 'users' as const, label: `Customers & Agents (${users.length})`, icon: Users },
          { id: 'inquiries' as const, label: `Inquiries & Viewings (${inquiries.length + viewings.length})`, icon: MessageSquare },
          { id: 'content' as const, label: 'Website Content', icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${
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

      {loading || !overview ? (
        <div className="text-sm text-slate-500 py-8">Loading executive metrics...</div>
      ) : tab === 'overview' ? (
        <div className="space-y-8">
          {/* 7 Required KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total Properties</div>
              <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
                {overview.totalProperties}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Active Listings</div>
              <div className="text-2xl font-semibold text-emerald-700 tabular-nums mt-1">
                {overview.activeListings}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Pending Approvals</div>
              <div className="text-2xl font-semibold text-amber-700 tabular-nums mt-1">
                {overview.pendingApprovals}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Sold & Rented</div>
              <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
                {overview.soldAndRented}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total Customers</div>
              <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
                {overview.totalCustomers}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total Agents</div>
              <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
                {overview.totalAgents}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total Inquiries</div>
              <div className="text-2xl font-semibold text-[#99732C] tabular-nums mt-1">
                {overview.totalInquiries}
              </div>
            </div>
          </div>

          {/* Monthly Statistics */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#0B1528]">
                  Monthly Brokerage Statistics (2026)
                </h2>
                <p className="text-xs text-slate-500">
                  Inbound inquiries, scheduled viewings, and closed transaction volume (AED Millions)
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                Total Views: {formatNumber(overview.totalViews)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 items-end h-52 pt-4 pb-2 border-b border-slate-100">
              {overview.monthlyStats.map((m) => {
                const maxVal = Math.max(...overview.monthlyStats.map((x) => x.closedValueM), 1);
                const heightPct = Math.max(18, Math.round((m.closedValueM / maxVal) * 100));
                return (
                  <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-[11px] font-mono text-[#0B1528] tabular-nums">
                      AED {m.closedValueM}M
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[44px] bg-[#0B1528] hover:bg-[#B68D40] transition-colors rounded-t-md"
                      title={`${m.month}: AED ${m.closedValueM}M closed`}
                    />
                    <div className="text-xs font-medium text-slate-600">{m.month}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 font-medium">Month</th>
                    <th className="py-2.5 font-medium text-right">Listings</th>
                    <th className="py-2.5 font-medium text-right">Inquiries</th>
                    <th className="py-2.5 font-medium text-right">Viewings</th>
                    <th className="py-2.5 font-medium text-right">Closed Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {overview.monthlyStats.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-[#0B1528]">{m.month} 2026</td>
                      <td className="py-2.5 text-right">{m.listings}</td>
                      <td className="py-2.5 text-right">{m.inquiries}</td>
                      <td className="py-2.5 text-right">{m.viewings}</td>
                      <td className="py-2.5 text-right font-mono">AED {m.closedValueM}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'approvals' ? (
        <div className="space-y-4">
          {pendingProperties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
              <h2 className="text-lg font-semibold text-[#0B1528]">Approval Queue Clear</h2>
              <p className="text-sm text-slate-600">
                All submitted listings have been reviewed.
              </p>
            </div>
          ) : (
            pendingProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <PropertyImage
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-28 aspect-[4/3] rounded-md object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-mono">
                      {prop.referenceNumber} · RERA {prop.reraPermit}
                    </div>
                    <h3 className="text-base font-semibold text-[#0B1528] font-sans">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {prop.location} · {prop.type} · {formatAed(prop.priceAed, prop.purpose)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePropertyPatch(prop, { status: 'active' })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropertyPatch(prop, { status: 'inactive' })}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:border-[#0B1528]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === 'properties' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenProperty(prop.id)}
                      className="font-semibold text-[#0B1528] hover:text-[#99732C] text-left block"
                    >
                      {prop.title}
                    </button>
                    <span className="font-mono text-[11px] text-slate-500">
                      {prop.referenceNumber} · {prop.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{prop.location}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                    {formatAed(prop.priceAed, prop.purpose)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Status for ${prop.title}`}
                      value={prop.status}
                      onChange={(e) =>
                        handlePropertyPatch(prop, { status: e.target.value as ListingStatus })
                      }
                      className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        handlePropertyPatch(prop, { featured: !prop.featured })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs ${
                        prop.featured
                          ? 'bg-[#B68D40]/15 border-[#B68D40] text-[#99732C] font-medium'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${prop.featured ? 'fill-[#B68D40]' : ''}`} />
                      {prop.featured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProp(prop);
                          setFormOpen(true);
                        }}
                        aria-label="Edit property"
                        className="p-1.5 border border-slate-200 rounded hover:border-[#0B1528]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProperty(prop)}
                        aria-label="Delete property"
                        className="p-1.5 border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'users' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Listings</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#0B1528]">{row.name}</div>
                    <div className="text-slate-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{row.phone}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Role for ${row.name}`}
                      disabled={row.id === user.id}
                      value={row.role}
                      onChange={(e) =>
                        handleUserPatch(row, { role: e.target.value as User['role'] })
                      }
                      className="px-2 py-1 border border-slate-300 rounded bg-white text-xs capitalize disabled:opacity-60"
                    >
                      <option value="customer">Customer</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.listingsCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleUserPatch(row, { verified: !row.verified })}
                      className={`px-2.5 py-1 rounded border text-xs ${
                        row.verified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      {row.verified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={row.id === user.id}
                      onClick={() => handleUserPatch(row, { active: !row.active })}
                      className={`px-2.5 py-1 rounded border text-xs disabled:opacity-50 ${
                        row.active
                          ? 'bg-white border-slate-300 text-[#0B1528]'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      {row.active ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'inquiries' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0B1528]">
              Customer Inquiries ({inquiries.length})
            </h2>
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-[#0B1528]">
                    {inq.name} · {inq.phone}
                  </span>
                  <span>{formatDate(inq.createdAt)}</span>
                </div>
                <div className="text-xs font-mono text-[#99732C]">
                  {inq.type === 'sell_valuation'
                    ? `Sell Valuation (${inq.sellDetails?.location || 'UAE'})`
                    : inq.propertyTitle || 'General Inquiry'}
                </div>
                <p className="text-xs text-slate-700">{inq.message}</p>
                <div className="flex items-center gap-2 pt-1">
                  <select
                    aria-label="Inquiry status"
                    value={inq.status}
                    onChange={(e) =>
                      handleInquiryStatus(inq, e.target.value as Inquiry['status'])
                    }
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0B1528]">
              Viewing Appointments ({viewings.length})
            </h2>
            {viewings.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-[#0B1528]">
                    {v.name} · {v.mode}
                  </span>
                  <span className="capitalize font-medium text-[#99732C]">{v.status}</span>
                </div>
                <div className="text-sm font-medium text-[#0B1528]">{v.propertyTitle}</div>
                <div className="text-xs text-slate-600 tabular-nums">
                  {v.preferredDate} at {v.preferredTime} · Agent: {v.agentName}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSaveCms}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-lg font-semibold text-[#0B1528]">
            Website Content Management
          </h2>
          <p className="text-xs text-slate-500">
            Updates publish immediately to the Prime Estate homepage and footer.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Homepage Hero Headline
            </label>
            <input
              type="text"
              required
              value={cms.heroHeadline}
              onChange={(e) => setCms({ ...cms, heroHeadline: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Homepage Hero Subheadline
            </label>
            <textarea
              rows={2}
              required
              value={cms.heroSubheadline}
              onChange={(e) => setCms({ ...cms, heroSubheadline: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Featured Section Heading
            </label>
            <input
              type="text"
              required
              value={cms.featuredBannerTitle}
              onChange={(e) => setCms({ ...cms, featuredBannerTitle: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              UAE Market Brief Banner
            </label>
            <textarea
              rows={2}
              required
              value={cms.marketBrief}
              onChange={(e) => setCms({ ...cms, marketBrief: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company Phone
              </label>
              <input
                type="text"
                required
                value={cms.companyPhone}
                onChange={(e) => setCms({ ...cms, companyPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                WhatsApp Number (digits)
              </label>
              <input
                type="text"
                required
                value={cms.companyWhatsapp}
                onChange={(e) => setCms({ ...cms, companyWhatsapp: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Advisory Email
              </label>
              <input
                type="email"
                required
                value={cms.companyEmail}
                onChange={(e) => setCms({ ...cms, companyEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                RERA Brokerage ORN
              </label>
              <input
                type="text"
                required
                value={cms.reraBrokerageId}
                onChange={(e) => setCms({ ...cms, reraBrokerageId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dubai Office Address
            </label>
            <input
              type="text"
              required
              value={cms.officeAddress}
              onChange={(e) => setCms({ ...cms, officeAddress: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0B1528] hover:bg-[#13223D] text-white text-sm font-medium rounded-md"
          >
            Publish Website Content
          </button>
        </form>
      )}

      <PropertyFormModal
        key={editingProp?.id || (formOpen ? 'new' : 'closed')}
        open={formOpen}
        editingProperty={editingProp}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          loadAll();
          showToast('Property catalog updated');
        }}
      />
    </div>
  );
}
