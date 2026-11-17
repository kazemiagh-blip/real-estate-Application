import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  Inquiry,
  Property,
  SiteContent,
  User,
  ViewingRequest,
} from '../src/types';

export interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface DatabaseState {
  users: StoredUser[];
  properties: Property[];
  inquiries: Inquiry[];
  viewings: ViewingRequest[];
  siteContent: SiteContent;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'prime-estate.json');
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const IMG_PALM_VILLA = '/src/assets/images/prop_palm_villa_1794929836368.jpg';
const IMG_DOWNTOWN_PH = '/src/assets/images/prop_downtown_penthouse_1794929837008.jpg';
const IMG_MARINA_APT = '/src/assets/images/prop_marina_apartment_1794929838106.jpg';
const IMG_HILLS_TH = '/src/assets/images/prop_hills_townhouse_1794929838495.jpg';
const IMG_DIFC_OFFICE = '/src/assets/images/prop_difc_office_1794929837691.jpg';
const IMG_HERO = '/src/assets/images/hero_dubai_penthouse_1794929835668.jpg';
const IMG_LAYLA = '/src/assets/images/agent_layla_portrait_1794929839340.jpg';
const IMG_TARIQ = '/src/assets/images/agent_tariq_portrait_1794929839233.jpg';

function createInitialState(): DatabaseState {
  const now = new Date('2026-11-10T09:00:00Z');
  const iso = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const custCred = hashPassword('Prime2026!');
  const laylaCred = hashPassword('Prime2026!');
  const tariqCred = hashPassword('Prime2026!');
  const adminCred = hashPassword('AdminPrime2026!');

  const users: StoredUser[] = [
    {
      id: 'usr-admin-1',
      name: 'Rashid Al Maktoum Advisory',
      email: 'admin@primeestate.ae',
      phone: '+971 4 388 9100',
      role: 'admin',
      active: true,
      verified: true,
      favorites: [],
      savedSearches: [],
      createdAt: iso(180),
      passwordHash: adminCred.hash,
      passwordSalt: adminCred.salt,
    },
    {
      id: 'usr-agent-layla',
      name: 'Layla Al Khouri',
      email: 'layla.alkhouri@primeestate.ae',
      phone: '+971 50 482 7710',
      whatsapp: '971504827710',
      role: 'agent',
      avatar: IMG_LAYLA,
      active: true,
      verified: true,
      agencyTitle: 'Senior Private Client Director',
      reraId: 'BRN-44891',
      bio: 'Specializing in Palm Jumeirah beachfront villas and Downtown Dubai signature penthouses with over AED 1.4B in closed private transactions.',
      languages: ['Arabic', 'English', 'French'],
      specialty: 'Ultra-Prime Waterfront & Penthouses',
      favorites: [],
      savedSearches: [],
      createdAt: iso(160),
      passwordHash: laylaCred.hash,
      passwordSalt: laylaCred.salt,
    },
    {
      id: 'usr-agent-tariq',
      name: 'Tariq Al Hashimi',
      email: 'tariq.alhashimi@primeestate.ae',
      phone: '+971 52 914 3308',
      whatsapp: '971529143308',
      role: 'agent',
      avatar: IMG_TARIQ,
      active: true,
      verified: true,
      agencyTitle: 'Head of Commercial & Master Communities',
      reraId: 'BRN-39120',
      bio: 'Advising institutional investors, family offices, and corporate tenants across DIFC, Business Bay, Dubai Hills Estate, and Saadiyat Island.',
      languages: ['English', 'Arabic'],
      specialty: 'Commercial, DIFC Offices & Villas',
      favorites: [],
      savedSearches: [],
      createdAt: iso(150),
      passwordHash: tariqCred.hash,
      passwordSalt: tariqCred.salt,
    },
    {
      id: 'usr-cust-nadia',
      name: 'Nadia Mansoor',
      email: 'nadia.mansoor@example.ae',
      phone: '+971 55 729 1840',
      role: 'customer',
      active: true,
      verified: true,
      favorites: ['prop-palm-villa-1', 'prop-downtown-ph-2'],
      savedSearches: [
        {
          id: 'ss-1',
          name: 'Palm & Downtown 4+ Bed Buy',
          filters: {
            purpose: 'Buy',
            bedrooms: '4',
            sort: 'price_desc',
          },
          createdAt: iso(12),
        },
      ],
      createdAt: iso(45),
      passwordHash: custCred.hash,
      passwordSalt: custCred.salt,
    },
  ];

  const properties: Property[] = [
    {
      id: 'prop-palm-villa-1',
      referenceNumber: 'PE-DXB-2026-101',
      reraPermit: '7129485102',
      title: 'Signature Frond G Beachfront Villa with Private Horizon Pool',
      purpose: 'Buy',
      type: 'Villa',
      location: 'Palm Jumeirah',
      community: 'Frond G, Palm Jumeirah',
      emirate: 'Dubai',
      address: 'Frond G, Palm Jumeirah, Dubai, UAE',
      coordinates: { lat: 25.1189, lng: 55.1342 },
      priceAed: 34500000,
      bedrooms: 6,
      bathrooms: 7,
      sizeSqFt: 11400,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'active',
      featured: true,
      description:
        'Positioned on one of the most sought-after private fronds of Palm Jumeirah, this newly completed architectural villa pairs travertine limestone facades with uninterrupted views toward the Dubai Marina skyline. Designed for indoor-outdoor coastal living, the residence features double-height formal reception halls, a Gaggenau show kitchen, private cinema, staff quarters, and 95 feet of private sandy beachfront.',
      features: [
        'Private Beachfront Access',
        'Temperature-Controlled Infinity Pool',
        'Gaggenau Show & Service Kitchens',
        'Private Cinema & Wine Room',
        'Smart Home Automation (KNX)',
        'Covered 4-Car Air-Conditioned Garage',
        'Maid & Driver Quarters',
        'Rooftop Sunset Lounge',
      ],
      images: [IMG_PALM_VILLA, IMG_HERO, IMG_DOWNTOWN_PH],
      agentId: 'usr-agent-layla',
      views: 1240,
      inquiriesCount: 18,
      createdAt: iso(4),
      updatedAt: iso(2),
    },
    {
      id: 'prop-downtown-ph-2',
      referenceNumber: 'PE-DXB-2026-102',
      reraPermit: '7129485219',
      title: 'Skyline Full-Floor Penthouse Overlooking Burj Khalifa & Fountain',
      purpose: 'Buy',
      type: 'Penthouse',
      location: 'Downtown Dubai',
      community: 'Boulevard Residences, Downtown Dubai',
      emirate: 'Dubai',
      address: 'Mohammed Bin Rashid Boulevard, Downtown Dubai, UAE',
      coordinates: { lat: 25.1972, lng: 55.2744 },
      priceAed: 26800000,
      bedrooms: 4,
      bathrooms: 5,
      sizeSqFt: 6850,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'active',
      featured: true,
      description:
        'Spanning an entire upper floor in Downtown Dubai, this bespoke penthouse frames panoramic dusk views of the Burj Khalifa and Dubai Fountain through 4-meter acoustic curtain glazing. Appointed in book-matched Italian travertine, brushed bronze hardware, and custom Minotti upholstery, with private elevator lobby access and expansive wrap-around terraces.',
      features: [
        'Private Elevator Lobby',
        'Full Burj Khalifa & Fountain View',
        'Wrap-Around Travertine Terrace',
        'Private Plunge Pool',
        '24/7 Valet & Concierge',
        'Private Gym & Spa Suite',
        '3 Reserved Podium Parking Bays',
      ],
      images: [IMG_DOWNTOWN_PH, IMG_HERO, IMG_MARINA_APT],
      agentId: 'usr-agent-layla',
      views: 980,
      inquiriesCount: 14,
      createdAt: iso(6),
      updatedAt: iso(1),
    },
    {
      id: 'prop-marina-apt-3',
      referenceNumber: 'PE-DXB-2026-103',
      reraPermit: '7129485304',
      title: 'Waterfront 3-Bedroom Marina Residence with Yacht Berth Views',
      purpose: 'Rent',
      type: 'Apartment',
      location: 'Dubai Marina',
      community: 'Marina Gate, Dubai Marina',
      emirate: 'Dubai',
      address: 'Marina Walk, Dubai Marina, Dubai, UAE',
      coordinates: { lat: 25.0865, lng: 55.1456 },
      priceAed: 360000,
      bedrooms: 3,
      bathrooms: 4,
      sizeSqFt: 2450,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'active',
      featured: true,
      description:
        'Bright corner residence situated directly along Marina Walk with sweeping views across the superyacht basin. Features warm European oak wide-plank flooring, floor-to-ceiling sliding doors opening onto a deep entertaining terrace, en-suite bedrooms with built-in wardrobes, and direct access to resort-grade lap pools and health club.',
      features: [
        'Direct Marina Walk Promenade Access',
        'Infinity Lap Pool & Squash Courts',
        'Fully Furnished Turnkey Interior',
        'Maid Room with En-Suite',
        '2 Covered Parking Spaces',
        'Chiller Free',
      ],
      images: [IMG_MARINA_APT, IMG_DOWNTOWN_PH],
      agentId: 'usr-agent-layla',
      views: 745,
      inquiriesCount: 11,
      createdAt: iso(8),
      updatedAt: iso(3),
    },
    {
      id: 'prop-hills-th-4',
      referenceNumber: 'PE-DXB-2026-104',
      reraPermit: '7129485490',
      title: 'Corner Park-Facing 4-Bedroom Limestone Townhouse',
      purpose: 'Buy',
      type: 'Townhouse',
      location: 'Dubai Hills Estate',
      community: 'Maple & Sidra Park Enclave, Dubai Hills Estate',
      emirate: 'Dubai',
      address: 'Dubai Hills Estate, Umm Suqeim St, Dubai, UAE',
      coordinates: { lat: 25.1066, lng: 55.2452 },
      priceAed: 6950000,
      bedrooms: 4,
      bathrooms: 5,
      sizeSqFt: 3680,
      furnished: 'Unfurnished',
      completion: 'Ready',
      status: 'active',
      featured: false,
      description:
        'Located on a quiet single-row corner plot steps from Dubai Hills Central Park and Championship Golf Course, this custom-upgraded townhouse offers a shaded timber pergola lounge, private landscaped garden with plunge pool, open-plan marble kitchen, and generous natural light across all levels.',
      features: [
        'Single-Row Corner Plot',
        'Landscaped Private Garden & Plunge Pool',
        'Minutes to Dubai Hills Golf Club',
        'Walkable to International Schools & Mall',
        'Covered 2-Car Driveway',
      ],
      images: [IMG_HILLS_TH, IMG_PALM_VILLA],
      agentId: 'usr-agent-tariq',
      views: 612,
      inquiriesCount: 9,
      createdAt: iso(9),
      updatedAt: iso(4),
    },
    {
      id: 'prop-difc-office-5',
      referenceNumber: 'PE-DXB-2026-105',
      reraPermit: '7129485612',
      title: 'Fitted Grade-A Executive Office Suite in Gate Village',
      purpose: 'Rent',
      type: 'Office',
      location: 'DIFC',
      community: 'Gate Village, DIFC',
      emirate: 'Dubai',
      address: 'Gate Village Building 8, DIFC, Dubai, UAE',
      coordinates: { lat: 25.2116, lng: 55.2815 },
      priceAed: 920000,
      bedrooms: 0,
      bathrooms: 3,
      sizeSqFt: 3200,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'active',
      featured: true,
      description:
        'Turnkey DIFC-licensed executive headquarters fitted to institutional banking and family-office standards. Includes a 12-seat walnut boardroom overlooking Sheikh Zayed Road, 4 private partner offices with double-glazed acoustic partitions, open analyst workstations, private pantry, and 6 dedicated basement parking allocations.',
      features: [
        'DIFC Free Zone Jurisdiction',
        'Acoustic Glass Partner Offices',
        '12-Seat Executive Boardroom',
        'Server Room & Biometric Access',
        '6 Reserved Basement Parking Bays',
        'Direct Gate Avenue Retail Link',
      ],
      images: [IMG_DIFC_OFFICE, IMG_DOWNTOWN_PH],
      agentId: 'usr-agent-tariq',
      views: 490,
      inquiriesCount: 7,
      createdAt: iso(11),
      updatedAt: iso(5),
    },
    {
      id: 'prop-saadiyat-land-6',
      referenceNumber: 'PE-AUH-2026-106',
      reraPermit: '2026008192',
      title: 'Freehold Sea-View Residential Land Plot near Cultural District',
      purpose: 'Buy',
      type: 'Land',
      location: 'Saadiyat Island',
      community: 'Saadiyat Reserve, Abu Dhabi',
      emirate: 'Abu Dhabi',
      address: 'Saadiyat Island Cultural District, Abu Dhabi, UAE',
      coordinates: { lat: 24.5393, lng: 54.4264 },
      priceAed: 14200000,
      bedrooms: 0,
      bathrooms: 0,
      sizeSqFt: 16500,
      furnished: 'Unfurnished',
      completion: 'Ready',
      status: 'active',
      featured: false,
      description:
        'Rare freehold coastal plot eligible for all nationalities on Saadiyat Island, minutes from the Louvre Abu Dhabi and pristine white-sand beaches. Approved for G+2 bespoke mansion construction with 65% allowable GFA coverage and all primary infrastructure utilities connected to plot boundary.',
      features: [
        '100% Freehold for All Nationalities',
        'Approved G+2 Custom Villa Zoning',
        'Minutes from Louvre Abu Dhabi & Soul Beach',
        'Full Infrastructure Ready',
      ],
      images: [IMG_PALM_VILLA, IMG_HILLS_TH],
      agentId: 'usr-agent-tariq',
      views: 318,
      inquiriesCount: 5,
      createdAt: iso(14),
      updatedAt: iso(6),
    },
    {
      id: 'prop-bbay-comm-7',
      referenceNumber: 'PE-DXB-2026-107',
      reraPermit: '7129485884',
      title: 'Half-Floor Canal-Facing Commercial Asset in Business Bay',
      purpose: 'Buy',
      type: 'Commercial',
      location: 'Business Bay',
      community: 'Dubai Water Canal, Business Bay',
      emirate: 'Dubai',
      address: 'Marasi Drive, Business Bay, Dubai, UAE',
      coordinates: { lat: 25.1862, lng: 55.2747 },
      priceAed: 16400000,
      bedrooms: 0,
      bathrooms: 4,
      sizeSqFt: 5900,
      furnished: 'Unfurnished',
      completion: 'Ready',
      status: 'active',
      featured: false,
      description:
        'High-yield commercial half-floor asset overlooking the Dubai Water Canal and Downtown skyline. Shell-and-core flexibility with floor-to-ceiling low-emissivity glazing, dedicated executive lift bank, and strong projected net yield of 7.8% in one of Dubai’s fastest-appreciating commercial corridors.',
      features: [
        '7.8% Projected Net Commercial Yield',
        '12 Allocated Covered Parking Spaces',
        'Dubai Water Canal Panoramic Views',
        'Dedicated VIP Lift Lobby',
      ],
      images: [IMG_DIFC_OFFICE, IMG_HERO],
      agentId: 'usr-agent-tariq',
      views: 285,
      inquiriesCount: 4,
      createdAt: iso(16),
      updatedAt: iso(7),
    },
    {
      id: 'prop-creek-offplan-8',
      referenceNumber: 'PE-DXB-2026-108',
      reraPermit: '7129485991',
      title: 'Off-Plan Sky Lagoon 2-Bedroom Residence with 60/40 Payment Plan',
      purpose: 'Buy',
      type: 'Apartment',
      location: 'Dubai Creek Harbour',
      community: 'Creek Beach & Island, Dubai Creek Harbour',
      emirate: 'Dubai',
      address: 'Dubai Creek Harbour, Ras Al Khor, Dubai, UAE',
      coordinates: { lat: 25.2051, lng: 55.3446 },
      priceAed: 3450000,
      bedrooms: 2,
      bathrooms: 3,
      sizeSqFt: 1580,
      furnished: 'Unfurnished',
      completion: 'Off-Plan',
      status: 'active',
      featured: false,
      description:
        'Thoughtfully proportioned 2-bedroom off-plan residence in Dubai Creek Harbour overlooking the Central Park and Creek Marina. Offers an attractive 60/40 post-handover payment structure, private balcony, and anticipated Q4 2027 completion by a tier-one master developer.',
      features: [
        '60/40 Developer Payment Plan',
        'Golden Visa Eligible Investment',
        'Creek Marina & Skyline View',
        'Private Lagoon & Yacht Club Access',
      ],
      images: [IMG_MARINA_APT, IMG_HERO],
      agentId: 'usr-agent-layla',
      views: 540,
      inquiriesCount: 8,
      createdAt: iso(3),
      updatedAt: iso(1),
    },
    {
      id: 'prop-jge-pending-9',
      referenceNumber: 'PE-DXB-2026-109',
      reraPermit: '7129486104',
      title: 'Earth Course Fairway 5-Bedroom Villa (Awaiting Review)',
      purpose: 'Buy',
      type: 'Villa',
      location: 'Jumeirah Golf Estates',
      community: 'Earth Course, Jumeirah Golf Estates',
      emirate: 'Dubai',
      address: 'Jumeirah Golf Estates, Dubai, UAE',
      coordinates: { lat: 25.0195, lng: 55.2028 },
      priceAed: 19200000,
      bedrooms: 5,
      bathrooms: 6,
      sizeSqFt: 8400,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'pending',
      featured: false,
      description:
        'Elevated fairway mansion overlooking the championship Earth Course 16th green. Newly submitted by agent for compliance verification and publishing.',
      features: [
        'Direct Golf Course Frontage',
        'Basement Cinema & Spa',
        'Private Infinity Pool',
      ],
      images: [IMG_HILLS_TH, IMG_PALM_VILLA],
      agentId: 'usr-agent-tariq',
      views: 12,
      inquiriesCount: 0,
      createdAt: iso(1),
      updatedAt: iso(1),
    },
    {
      id: 'prop-downtown-sold-10',
      referenceNumber: 'PE-DXB-2026-094',
      reraPermit: '7129484002',
      title: 'Opera District 3-Bedroom Duplex Residence',
      purpose: 'Buy',
      type: 'Apartment',
      location: 'Downtown Dubai',
      community: 'Opera District, Downtown Dubai',
      emirate: 'Dubai',
      address: 'Opera Grand, Downtown Dubai, UAE',
      coordinates: { lat: 25.1932, lng: 55.2721 },
      priceAed: 11800000,
      bedrooms: 3,
      bathrooms: 4,
      sizeSqFt: 3340,
      furnished: 'Furnished',
      completion: 'Ready',
      status: 'sold',
      featured: false,
      description:
        'Recently closed private sale in the Opera District featuring double-height living volume and direct views of Dubai Opera.',
      features: ['Burj & Opera Views', 'Concierge Valet', 'Double-Height Salon'],
      images: [IMG_DOWNTOWN_PH],
      agentId: 'usr-agent-layla',
      views: 1410,
      inquiriesCount: 22,
      createdAt: iso(40),
      updatedAt: iso(10),
    },
  ];

  const inquiries: Inquiry[] = [
    {
      id: 'inq-1',
      type: 'property_inquiry',
      propertyId: 'prop-palm-villa-1',
      propertyTitle: 'Signature Frond G Beachfront Villa with Private Horizon Pool',
      propertyRef: 'PE-DXB-2026-101',
      agentId: 'usr-agent-layla',
      customerId: 'usr-cust-nadia',
      name: 'Nadia Mansoor',
      email: 'nadia.mansoor@example.ae',
      phone: '+971 55 729 1840',
      message: 'Could you please share the floor plans and confirm whether the bespoke furniture package is included in the asking price?',
      status: 'contacted',
      agentNote: 'Sent full architectural dossier and furniture inventory via WhatsApp.',
      createdAt: iso(5),
      updatedAt: iso(4),
    },
    {
      id: 'inq-2',
      type: 'sell_valuation',
      agentId: 'usr-agent-tariq',
      name: 'Omar Al Suwaidi',
      email: 'omar.alsuwaidi@example.ae',
      phone: '+971 50 319 8821',
      message: 'Seeking an off-market valuation for a 5-bedroom custom villa in Emirates Hills Sector E.',
      sellDetails: {
        propertyType: 'Villa',
        location: 'Emirates Hills',
        purpose: 'Buy',
        expectedPriceAed: 42000000,
        sizeSqFt: 13500,
      },
      status: 'new',
      createdAt: iso(2),
      updatedAt: iso(2),
    },
  ];

  const viewings: ViewingRequest[] = [
    {
      id: 'view-1',
      propertyId: 'prop-downtown-ph-2',
      propertyTitle: 'Skyline Full-Floor Penthouse Overlooking Burj Khalifa & Fountain',
      propertyLocation: 'Downtown Dubai',
      propertyRef: 'PE-DXB-2026-102',
      propertyImage: IMG_DOWNTOWN_PH,
      agentId: 'usr-agent-layla',
      agentName: 'Layla Al Khouri',
      customerId: 'usr-cust-nadia',
      name: 'Nadia Mansoor',
      email: 'nadia.mansoor@example.ae',
      phone: '+971 55 729 1840',
      preferredDate: '2026-11-22',
      preferredTime: '17:00',
      mode: 'In-Person',
      notes: 'Would love to see the sunset lighting and fountain view at dusk.',
      status: 'confirmed',
      agentNote: 'Confirmed valet registration at Boulevard Plaza entrance.',
      createdAt: iso(3),
      updatedAt: iso(2),
    },
  ];

  const siteContent: SiteContent = {
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

  return { users, properties, inquiries, viewings, siteContent };
}

let cachedState: DatabaseState | null = null;

export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function loadDb(): DatabaseState {
  if (cachedState) return cachedState;
  ensureDirectories();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      cachedState = JSON.parse(raw) as DatabaseState;
      return cachedState;
    } catch (err) {
      console.error('Failed to parse database file, re-initializing:', err);
    }
  }
  cachedState = createInitialState();
  saveDb(cachedState);
  return cachedState;
}

export function saveDb(state: DatabaseState): void {
  ensureDirectories();
  cachedState = state;
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

export function sanitizeUser(user: StoredUser): User {
  const { passwordHash: _ph, passwordSalt: _ps, ...rest } = user;
  return rest;
}
