import { Building2, Calendar, Edit3, Eye, LogOut, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { formatAed, formatDate, formatNumber } from '../lib/format';
import type { Inquiry, ListingStatus, Property, ViewingRequest } from '../types';
import { PropertyFormModal } from './PropertyFormModal';
import { PropertyImage } from './PropertyImage';

interface AgentDashboardProps {
  onOpenProperty: (id: string) => void;
  onLoggedOut: () => void;
}

type AgentTab = 'listings' | 'inquiries' | 'viewings';

export function AgentDashboard({ onOpenProperty, onLoggedOut }: AgentDashboardProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AgentTab>('listings');
  const [listings, setListings] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');

  const loadAgentData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [propsRes, inqRes, viewRes] = await Promise.all([
        apiFetch<{ properties: Property[] }>(`/api/properties?agentId=${user.id}&status=All`),
        apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries'),
        apiFetch<{ viewings: ViewingRequest[] }>('/api/viewings'),
      ]);
      setListings(propsRes.properties);
      setInquiries(inqRes.inquiries);
      setViewings(viewRes.viewings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [user?.id]);

  if (!user) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handlePriceSave = async (prop: Property) => {
    const raw = priceDrafts[prop.id];
    const nextPrice = Number(raw);
    if (!nextPrice || nextPrice <= 0) return;
    const res = await apiFetch<{ property: Property }>(`/api/properties/${prop.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ priceAed: nextPrice }),
    });
    setListings((prev) => prev.map((p) => (p.id === prop.id ? res.property : p)));
    showToast(`Updated price for ${prop.referenceNumber}`);
  };

  const handleStatusChange = async (prop: Property, status: ListingStatus) => {
    const res = await apiFetch<{ property: Property }>(`/api/properties/${prop.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setListings((prev) => prev.map((p) => (p.id === prop.id ? res.property : p)));
    showToast(`Listing status updated to ${status}`);
  };

  const handleDeleteProperty = async (prop: Property) => {
    await apiFetch(`/api/properties/${prop.id}`, { method: 'DELETE' });
    setListings((prev) => prev.filter((p) => p.id !== prop.id));
    showToast(`Deleted ${prop.referenceNumber}`);
  };

  const handleUpdateInquiry = async (inq: Inquiry, status: Inquiry['status']) => {
    const note = noteDrafts[inq.id] ?? inq.agentNote ?? '';
    const res = await apiFetch<{ inquiry: Inquiry }>(`/api/inquiries/${inq.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, agentNote: note }),
    });
    setInquiries((prev) => prev.map((i) => (i.id === inq.id ? res.inquiry : i)));
    showToast('Inquiry updated');
  };

  const handleUpdateViewing = async (
    viewing: ViewingRequest,
    status: ViewingRequest['status']
  ) => {
    const note = noteDrafts[viewing.id] ?? viewing.agentNote ?? '';
    const res = await apiFetch<{ viewing: ViewingRequest }>(`/api/viewings/${viewing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, agentNote: note }),
    });
    setViewings((prev) => prev.map((v) => (v.id === viewing.id ? res.viewing : v)));
    showToast(`Viewing marked ${status}`);
  };

  const totalViews = listings.reduce((sum, p) => sum + p.views, 0);
  const activeCount = listings.filter((p) => p.status === 'active').length;
  const pendingCount = listings.filter((p) => p.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#99732C]">
            Real Estate Agent Portal · {user.reraId || 'BRN-Active'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1528] mt-1">
            {user.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {user.agencyTitle || 'Property Advisor'} · {user.specialty || 'UAE Prime Portfolio'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingProp(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B68D40] hover:bg-[#99732C] text-white text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Property
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

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Total Listings</div>
          <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
            {listings.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Active Published</div>
          <div className="text-2xl font-semibold text-emerald-700 tabular-nums mt-1">
            {activeCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Pending Approval</div>
          <div className="text-2xl font-semibold text-amber-700 tabular-nums mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Total Property Views</div>
          <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
            {formatNumber(totalViews)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-500">Inquiries & Viewings</div>
          <div className="text-2xl font-semibold text-[#0B1528] tabular-nums mt-1">
            {inquiries.length + viewings.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-6 mb-8 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('listings')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md ${
            tab === 'listings'
              ? 'bg-[#0B1528] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          My Listings ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('inquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md ${
            tab === 'inquiries'
              ? 'bg-[#0B1528] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Customer Inquiries ({inquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('viewings')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md ${
            tab === 'viewings'
              ? 'bg-[#0B1528] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Viewing Appointments ({viewings.length})
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-8">Loading agent workspace...</div>
      ) : tab === 'listings' ? (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <h2 className="text-lg font-semibold text-[#0B1528]">No Listings Created</h2>
              <p className="text-sm text-slate-600">
                Add your first UAE property listing with multi-photo gallery and RERA reference.
              </p>
            </div>
          ) : (
            listings.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <PropertyImage
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-28 aspect-[4/3] rounded-md object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-[#0B1528]">{prop.referenceNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.location}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold capitalize text-[#99732C]">
                        Status: {prop.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenProperty(prop.id)}
                      className="text-base font-semibold text-[#0B1528] hover:text-[#99732C] text-left line-clamp-1"
                    >
                      {prop.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 tabular-nums">
                      <span className="font-mono font-semibold text-[#0B1528]">
                        {formatAed(prop.priceAed, prop.purpose)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {formatNumber(prop.views)} views
                      </span>
                      <span>{prop.inquiriesCount} inquiries</span>
                    </div>
                  </div>
                </div>

                {/* Agent Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1000"
                      value={priceDrafts[prop.id] ?? String(prop.priceAed)}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({ ...prev, [prop.id]: e.target.value }))
                      }
                      aria-label={`Price in AED for ${prop.title}`}
                      className="w-28 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => handlePriceSave(prop)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1528] text-xs font-medium rounded-md"
                    >
                      Update Price
                    </button>
                  </div>

                  {prop.status !== 'pending' && (
                    <select
                      aria-label={`Status for ${prop.title}`}
                      value={prop.status}
                      onChange={(e) =>
                        handleStatusChange(prop, e.target.value as ListingStatus)
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProp(prop);
                      setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 hover:border-[#0B1528] text-xs font-medium rounded-md text-[#0B1528]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProperty(prop)}
                    aria-label="Delete listing"
                    className="p-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === 'inquiries' ? (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-600">
              No inquiries assigned to your listings yet.
            </div>
          ) : (
            inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#0B1528]">
                    {inq.name} · {inq.phone} · {inq.email}
                  </span>
                  <span className="capitalize font-medium text-[#99732C]">
                    Status: {inq.status} · {formatDate(inq.createdAt)}
                  </span>
                </div>
                {inq.propertyTitle && (
                  <div className="text-xs font-mono text-slate-600">
                    Property: {inq.propertyTitle} ({inq.propertyRef})
                  </div>
                )}
                <p className="text-sm text-slate-700">{inq.message}</p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <input
                    type="text"
                    value={noteDrafts[inq.id] ?? inq.agentNote ?? ''}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                    }
                    placeholder="Add response or follow-up note..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateInquiry(inq, 'contacted')}
                      className="px-3.5 py-2 bg-[#0B1528] text-white text-xs font-medium rounded-md"
                    >
                      Mark Contacted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateInquiry(inq, 'closed')}
                      className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:border-[#0B1528]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {viewings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-600">
              No viewing appointments scheduled yet.
            </div>
          ) : (
            viewings.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#0B1528]">
                    {v.name} · {v.phone} · {v.mode}
                  </span>
                  <span className="capitalize font-medium text-[#99732C]">
                    Status: {v.status} · {v.preferredDate} at {v.preferredTime}
                  </span>
                </div>
                <div className="text-sm font-medium text-[#0B1528]">
                  {v.propertyTitle} ({v.propertyRef})
                </div>
                {v.notes && <p className="text-xs text-slate-600">Client Notes: {v.notes}</p>}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <input
                    type="text"
                    value={noteDrafts[v.id] ?? v.agentNote ?? ''}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    placeholder="Meeting point, gate pass, or video link note..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateViewing(v, 'confirmed')}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-md"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateViewing(v, 'completed')}
                      className="px-3 py-2 bg-[#0B1528] text-white text-xs font-medium rounded-md"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateViewing(v, 'cancelled')}
                      className="px-3 py-2 border border-red-200 text-red-700 text-xs font-medium rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <PropertyFormModal
        key={editingProp?.id || (formOpen ? 'new' : 'closed')}
        open={formOpen}
        editingProperty={editingProp}
        onClose={() => setFormOpen(false)}
        onSaved={(saved) => {
          setListings((prev) => {
            const exists = prev.some((p) => p.id === saved.id);
            return exists
              ? prev.map((p) => (p.id === saved.id ? saved : p))
              : [saved, ...prev];
          });
          showToast(
            editingProp
              ? `Saved changes to ${saved.referenceNumber}`
              : `Submitted ${saved.referenceNumber} for administrator approval`
          );
        }}
      />
    </div>
  );
}
