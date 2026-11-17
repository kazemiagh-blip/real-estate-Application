export type UserRole = 'customer' | 'agent' | 'admin';

export type PropertyPurpose = 'Buy' | 'Rent';

export type PropertyType =
  | 'Apartment'
  | 'Villa'
  | 'Townhouse'
  | 'Penthouse'
  | 'Commercial'
  | 'Office'
  | 'Land';

export type FurnishedStatus = 'Furnished' | 'Unfurnished';
export type CompletionStatus = 'Ready' | 'Off-Plan';
export type ListingStatus = 'active' | 'pending' | 'inactive' | 'sold' | 'rented';

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  verified?: boolean;
  agencyTitle?: string;
  reraId?: string;
  bio?: string;
  languages?: string[];
  specialty?: string;
  whatsapp?: string;
  favorites: string[];
  savedSearches: SavedSearch[];
  createdAt: string;
}

export interface AgentPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  avatar: string;
  agencyTitle: string;
  reraId: string;
  bio: string;
  languages: string[];
  specialty: string;
  verified: boolean;
  activeListingsCount: number;
  closedDealsCount: number;
}

export interface Property {
  id: string;
  referenceNumber: string;
  reraPermit: string;
  title: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  location: string;
  community: string;
  emirate: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  priceAed: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt: number;
  furnished: FurnishedStatus;
  completion: CompletionStatus;
  status: ListingStatus;
  featured: boolean;
  description: string;
  features: string[];
  images: string[];
  agentId: string;
  views: number;
  inquiriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type InquiryType = 'property_inquiry' | 'sell_valuation' | 'general';
export type InquiryStatus = 'new' | 'contacted' | 'closed';

export interface Inquiry {
  id: string;
  type: InquiryType;
  propertyId?: string;
  propertyTitle?: string;
  propertyRef?: string;
  agentId?: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  sellDetails?: {
    propertyType: PropertyType;
    location: string;
    purpose: PropertyPurpose;
    expectedPriceAed?: number;
    sizeSqFt?: number;
  };
  status: InquiryStatus;
  agentNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ViewingMode = 'In-Person' | 'Live Video';

export interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyRef: string;
  propertyImage: string;
  agentId: string;
  agentName: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  mode: ViewingMode;
  notes: string;
  status: ViewingStatus;
  agentNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteContent {
  heroHeadline: string;
  heroSubheadline: string;
  featuredBannerTitle: string;
  marketBrief: string;
  companyPhone: string;
  companyWhatsapp: string;
  companyEmail: string;
  officeAddress: string;
  reraBrokerageId: string;
}

export interface PropertyFilters {
  q?: string;
  purpose?: 'All' | PropertyPurpose;
  type?: 'All' | PropertyType;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  minSize?: string;
  maxSize?: string;
  furnished?: 'All' | FurnishedStatus;
  completion?: 'All' | CompletionStatus;
  agentId?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

export interface MonthlyStat {
  month: string;
  listings: number;
  inquiries: number;
  viewings: number;
  closedValueM: number;
}

export interface AdminOverview {
  totalProperties: number;
  activeListings: number;
  pendingApprovals: number;
  soldAndRented: number;
  totalCustomers: number;
  totalAgents: number;
  totalInquiries: number;
  totalViewings: number;
  totalViews: number;
  monthlyStats: MonthlyStat[];
}
