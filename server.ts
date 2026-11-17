import crypto from 'crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  hashPassword,
  loadDb,
  sanitizeUser,
  saveDb,
  UPLOADS_DIR,
  verifyPassword,
  type StoredUser,
} from './server/db';
import type {
  AdminOverview,
  AgentPublic,
  Inquiry,
  ListingStatus,
  Property,
  PropertyType,
  UserRole,
  ViewingRequest,
} from './src/types';

const PORT = 3000;
const COOKIE_NAME = 'prime_estate_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'prime-estate-uae-dev-secret-key-2026';

interface SessionPayload {
  uid: string;
  role: UserRole;
  exp: number;
}

function signSession(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySession(token: string): SessionPayload | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encoded)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  const token = bearerToken || cookies[COOKIE_NAME];
  if (token) {
    const payload = verifySession(token);
    if (payload) {
      const db = loadDb();
      const user = db.users.find((u) => u.id === payload.uid && u.active);
      if (user) {
        req.currentUser = user;
      }
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

function requireRoles(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    next();
  };
}

function setSessionCookie(res: Response, user: StoredUser) {
  const token = signSession({
    uid: user.id,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function toAgentPublic(user: StoredUser, properties: Property[]): AgentPublic {
  const agentProps = properties.filter((p) => p.agentId === user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsapp || user.phone.replace(/\D/g, ''),
    avatar:
      user.avatar ||
      '/src/assets/images/agent_tariq_portrait_1794929839233.jpg',
    agencyTitle: user.agencyTitle || 'Real Estate Advisor',
    reraId: user.reraId || 'BRN-Pending',
    bio:
      user.bio ||
      'Dedicated UAE property specialist advising private buyers, tenants, and investors.',
    languages: user.languages?.length ? user.languages : ['English', 'Arabic'],
    specialty: user.specialty || 'Dubai Residential & Investment',
    verified: Boolean(user.verified),
    activeListingsCount: agentProps.filter((p) => p.status === 'active').length,
    closedDealsCount: agentProps.filter(
      (p) => p.status === 'sold' || p.status === 'rented'
    ).length,
  };
}

async function startServer() {
  loadDb();
  const app = express();
  app.use(express.json({ limit: '35mb' }));
  app.use(attachUser);

  // Serve uploaded property photos from disk
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ---------- AUTH ROUTES ----------
  app.post('/api/auth/register', (req: AuthedRequest, res: Response) => {
    const {
      name,
      email,
      password,
      phone,
      role,
      agencyTitle,
      reraId,
      specialty,
      bio,
    } = req.body || {};

    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: 'Name, email, phone, and password are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = loadDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const assignedRole: UserRole = role === 'agent' ? 'agent' : 'customer';
    const { hash, salt } = hashPassword(String(password));
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim().slice(0, 120),
      email: cleanEmail,
      phone: String(phone).trim().slice(0, 40),
      whatsapp: String(phone).replace(/\D/g, ''),
      role: assignedRole,
      active: true,
      verified: assignedRole === 'customer',
      agencyTitle:
        assignedRole === 'agent'
          ? String(agencyTitle || 'Private Property Advisor').trim().slice(0, 80)
          : undefined,
      reraId:
        assignedRole === 'agent'
          ? String(reraId || `BRN-${Math.floor(40000 + Math.random() * 50000)}`).trim().slice(0, 40)
          : undefined,
      specialty:
        assignedRole === 'agent'
          ? String(specialty || 'Dubai Residential & Commercial').trim().slice(0, 100)
          : undefined,
      bio:
        assignedRole === 'agent'
          ? String(bio || 'Certified UAE real estate specialist serving Dubai & Abu Dhabi clients.').trim().slice(0, 600)
          : undefined,
      languages: assignedRole === 'agent' ? ['English', 'Arabic'] : undefined,
      favorites: [],
      savedSearches: [],
      createdAt: now,
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.users.push(newUser);
    saveDb(db);
    const token = setSessionCookie(res, newUser);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  app.post('/api/auth/login', (req: AuthedRequest, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const db = loadDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user || !verifyPassword(String(password), user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!user.active) {
      res.status(403).json({ error: 'This account has been deactivated by an administrator.' });
      return;
    }
    const token = setSessionCookie(res, user);
    res.json({ user: sanitizeUser(user), token });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res: Response) => {
    if (!req.currentUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(req.currentUser) });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const { name, phone, agencyTitle, specialty, bio, languages, whatsapp } = req.body || {};
    if (typeof name === 'string' && name.trim()) user.name = name.trim().slice(0, 120);
    if (typeof phone === 'string' && phone.trim()) user.phone = phone.trim().slice(0, 40);
    if (typeof whatsapp === 'string') user.whatsapp = whatsapp.replace(/\D/g, '').slice(0, 20);
    if (user.role === 'agent') {
      if (typeof agencyTitle === 'string') user.agencyTitle = agencyTitle.trim().slice(0, 80);
      if (typeof specialty === 'string') user.specialty = specialty.trim().slice(0, 100);
      if (typeof bio === 'string') user.bio = bio.trim().slice(0, 800);
      if (Array.isArray(languages)) {
        user.languages = languages.map((l) => String(l).trim()).filter(Boolean).slice(0, 8);
      }
    }
    saveDb(db);
    res.json({ user: sanitizeUser(user) });
  });

  // ---------- FAVORITES & SAVED SEARCHES ----------
  app.post('/api/favorites/toggle', requireAuth, (req: AuthedRequest, res: Response) => {
    const { propertyId } = req.body || {};
    if (!propertyId) {
      res.status(400).json({ error: 'propertyId is required.' });
      return;
    }
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const exists = user.favorites.includes(propertyId);
    user.favorites = exists
      ? user.favorites.filter((id) => id !== propertyId)
      : [...user.favorites, propertyId];
    saveDb(db);
    res.json({ favorites: user.favorites, user: sanitizeUser(user) });
  });

  app.post('/api/saved-searches', requireAuth, (req: AuthedRequest, res: Response) => {
    const { name, filters } = req.body || {};
    if (!name || !filters) {
      res.status(400).json({ error: 'Search name and filters are required.' });
      return;
    }
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const entry = {
      id: `ss-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim().slice(0, 80),
      filters,
      createdAt: new Date().toISOString(),
    };
    user.savedSearches.unshift(entry);
    saveDb(db);
    res.status(201).json({ savedSearches: user.savedSearches, user: sanitizeUser(user) });
  });

  app.delete('/api/saved-searches/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    user.savedSearches = user.savedSearches.filter((s) => s.id !== req.params.id);
    saveDb(db);
    res.json({ savedSearches: user.savedSearches, user: sanitizeUser(user) });
  });

  // ---------- PUBLIC SITE CONTENT & AGENTS ----------
  app.get('/api/content', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ content: db.siteContent });
  });

  app.get('/api/agents', (_req: Request, res: Response) => {
    const db = loadDb();
    const agents = db.users
      .filter((u) => u.role === 'agent' && u.active)
      .map((u) => toAgentPublic(u, db.properties));
    res.json({ agents });
  });

  // ---------- IMAGE UPLOAD ----------
  app.post(
    '/api/upload',
    requireRoles('agent', 'admin'),
    (req: AuthedRequest, res: Response) => {
      const { files } = req.body || {};
      if (!Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: 'No image files provided.' });
        return;
      }
      if (files.length > 10) {
        res.status(400).json({ error: 'Maximum 10 images per upload batch.' });
        return;
      }

      const urls: string[] = [];
      for (const item of files) {
        const dataUrl = String(item?.dataUrl || '');
        const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) {
          res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are supported.' });
          return;
        }
        const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
        const buffer = Buffer.from(match[3], 'base64');
        if (buffer.length > 6 * 1024 * 1024) {
          res.status(400).json({ error: 'Each image must be 6MB or smaller.' });
          return;
        }
        const filename = `prop-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
        urls.push(`/uploads/${filename}`);
      }
      res.status(201).json({ urls });
    }
  );

  // ---------- PROPERTIES ----------
  app.get('/api/properties', (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const {
      q,
      purpose,
      type,
      location,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minSize,
      maxSize,
      furnished,
      completion,
      featured,
      agentId,
      status,
      sort,
      ids,
    } = req.query as Record<string, string | undefined>;

    const user = req.currentUser;
    const isAdmin = user?.role === 'admin';
    const isOwnerAgent = Boolean(user?.role === 'agent' && agentId === user.id);

    let items = db.properties.filter((p) => {
      if (ids) {
        const idSet = new Set(ids.split(',').map((s) => s.trim()));
        if (!idSet.has(p.id)) return false;
      }
      if (status && status !== 'All') {
        if (!isAdmin && !isOwnerAgent && status !== 'active') return false;
        if (p.status !== status) return false;
      } else if (!isAdmin && !isOwnerAgent && !ids) {
        if (p.status !== 'active') return false;
      }
      if (agentId && p.agentId !== agentId) return false;
      if (featured === 'true' && !p.featured) return false;
      if (purpose && purpose !== 'All' && p.purpose !== purpose) return false;
      if (type && type !== 'All' && p.type !== type) return false;
      if (furnished && furnished !== 'All' && p.furnished !== furnished) return false;
      if (completion && completion !== 'All' && p.completion !== completion) return false;
      if (location && location !== 'All') {
        const locNeedle = location.toLowerCase();
        const hay = `${p.location} ${p.community} ${p.emirate} ${p.address}`.toLowerCase();
        if (!hay.includes(locNeedle)) return false;
      }
      if (q && q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${p.title} ${p.location} ${p.community} ${p.emirate} ${p.type} ${p.referenceNumber} ${p.description}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (minPrice && Number(minPrice) > 0 && p.priceAed < Number(minPrice)) return false;
      if (maxPrice && Number(maxPrice) > 0 && p.priceAed > Number(maxPrice)) return false;
      if (minSize && Number(minSize) > 0 && p.sizeSqFt < Number(minSize)) return false;
      if (maxSize && Number(maxSize) > 0 && p.sizeSqFt > Number(maxSize)) return false;
      if (bedrooms && bedrooms !== 'All') {
        if (bedrooms === '0') {
          if (p.bedrooms !== 0) return false;
        } else {
          const minBeds = Number(bedrooms);
          if (p.bedrooms < minBeds) return false;
        }
      }
      if (bathrooms && bathrooms !== 'All') {
        const minBaths = Number(bathrooms);
        if (p.bathrooms < minBaths) return false;
      }
      return true;
    });

    if (sort === 'price_asc') {
      items = [...items].sort((a, b) => a.priceAed - b.priceAed);
    } else if (sort === 'price_desc') {
      items = [...items].sort((a, b) => b.priceAed - a.priceAed);
    } else if (sort === 'popular') {
      items = [...items].sort(
        (a, b) => b.views + b.inquiriesCount * 20 - (a.views + a.inquiriesCount * 20)
      );
    } else {
      items = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const agentsById = new Map<string, AgentPublic>();
    for (const u of db.users) {
      if (u.role === 'agent' || u.role === 'admin') {
        agentsById.set(u.id, toAgentPublic(u, db.properties));
      }
    }

    const enriched = items.map((p) => ({
      ...p,
      agent: agentsById.get(p.agentId) || null,
    }));

    res.json({ properties: enriched });
  });

  app.get('/api/properties/:id', (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const property = db.properties.find((p) => p.id === req.params.id);
    if (!property) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }

    const canViewUnpublished =
      req.currentUser?.role === 'admin' ||
      req.currentUser?.id === property.agentId;
    if (property.status === 'pending' && !canViewUnpublished) {
      res.status(404).json({ error: 'Property is awaiting review.' });
      return;
    }

    property.views += 1;
    saveDb(db);

    const agentUser = db.users.find((u) => u.id === property.agentId);
    const agent = agentUser ? toAgentPublic(agentUser, db.properties) : null;

    const similar = db.properties
      .filter(
        (p) =>
          p.id !== property.id &&
          p.status === 'active' &&
          (p.location === property.location || p.type === property.type)
      )
      .slice(0, 3)
      .map((p) => {
        const au = db.users.find((u) => u.id === p.agentId);
        return { ...p, agent: au ? toAgentPublic(au, db.properties) : null };
      });

    res.json({ property, agent, similar });
  });

  app.post(
    '/api/properties',
    requireRoles('agent', 'admin'),
    (req: AuthedRequest, res: Response) => {
      const b = req.body || {};
      if (!b.title || !b.location || !b.priceAed || !b.sizeSqFt || !b.type || !b.purpose) {
        res.status(400).json({ error: 'Missing required property fields.' });
        return;
      }

      const db = loadDb();
      const now = new Date().toISOString();
      const seq = 110 + db.properties.length + Math.floor(Math.random() * 50);
      const emirateCode = String(b.emirate || 'Dubai').toLowerCase().includes('abu')
        ? 'AUH'
        : 'DXB';
      const defaultImage = '/src/assets/images/prop_downtown_penthouse_1794929837008.jpg';
      const images =
        Array.isArray(b.images) && b.images.length > 0
          ? b.images.map((s: unknown) => String(s)).slice(0, 10)
          : [defaultImage];

      const isAdmin = req.currentUser!.role === 'admin';
      const initialStatus: ListingStatus =
        isAdmin && b.status === 'active' ? 'active' : 'pending';

      const newProp: Property = {
        id: `prop-${crypto.randomUUID().slice(0, 8)}`,
        referenceNumber: `PE-${emirateCode}-2026-${seq}`,
        reraPermit: String(b.reraPermit || Math.floor(7129480000 + Math.random() * 99999)),
        title: String(b.title).trim().slice(0, 140),
        purpose: b.purpose === 'Rent' ? 'Rent' : 'Buy',
        type: b.type as PropertyType,
        location: String(b.location).trim().slice(0, 80),
        community: String(b.community || b.location).trim().slice(0, 120),
        emirate: String(b.emirate || 'Dubai').trim().slice(0, 50),
        address: String(b.address || `${b.location}, UAE`).trim().slice(0, 180),
        coordinates:
          b.coordinates?.lat && b.coordinates?.lng
            ? { lat: Number(b.coordinates.lat), lng: Number(b.coordinates.lng) }
            : { lat: 25.1972, lng: 55.2744 },
        priceAed: Math.max(1000, Number(b.priceAed)),
        bedrooms: Math.max(0, Number(b.bedrooms || 0)),
        bathrooms: Math.max(0, Number(b.bathrooms || 1)),
        sizeSqFt: Math.max(100, Number(b.sizeSqFt)),
        furnished: b.furnished === 'Furnished' ? 'Furnished' : 'Unfurnished',
        completion: b.completion === 'Off-Plan' ? 'Off-Plan' : 'Ready',
        status: initialStatus,
        featured: isAdmin ? Boolean(b.featured) : false,
        description: String(b.description || 'Prime UAE residence presented by Prime Estate.').trim().slice(0, 3000),
        features: Array.isArray(b.features)
          ? b.features.map((f: unknown) => String(f).trim()).filter(Boolean).slice(0, 20)
          : ['24/7 Security', 'Covered Parking'],
        images,
        agentId:
          isAdmin && b.agentId ? String(b.agentId) : req.currentUser!.id,
        views: 0,
        inquiriesCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      db.properties.unshift(newProp);
      saveDb(db);
      res.status(201).json({ property: newProp });
    }
  );

  app.patch(
    '/api/properties/:id',
    requireRoles('agent', 'admin'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const prop = db.properties.find((p) => p.id === req.params.id);
      if (!prop) {
        res.status(404).json({ error: 'Property not found.' });
        return;
      }
      const isAdmin = req.currentUser!.role === 'admin';
      if (!isAdmin && prop.agentId !== req.currentUser!.id) {
        res.status(403).json({ error: 'You can only modify your own listings.' });
        return;
      }

      const b = req.body || {};
      if (typeof b.title === 'string' && b.title.trim()) prop.title = b.title.trim().slice(0, 140);
      if (b.purpose === 'Buy' || b.purpose === 'Rent') prop.purpose = b.purpose;
      if (typeof b.type === 'string') prop.type = b.type as PropertyType;
      if (typeof b.location === 'string' && b.location.trim()) prop.location = b.location.trim().slice(0, 80);
      if (typeof b.community === 'string') prop.community = b.community.trim().slice(0, 120);
      if (typeof b.emirate === 'string') prop.emirate = b.emirate.trim().slice(0, 50);
      if (typeof b.address === 'string') prop.address = b.address.trim().slice(0, 180);
      if (b.priceAed !== undefined && Number(b.priceAed) > 0) prop.priceAed = Number(b.priceAed);
      if (b.bedrooms !== undefined) prop.bedrooms = Math.max(0, Number(b.bedrooms));
      if (b.bathrooms !== undefined) prop.bathrooms = Math.max(0, Number(b.bathrooms));
      if (b.sizeSqFt !== undefined && Number(b.sizeSqFt) > 0) prop.sizeSqFt = Number(b.sizeSqFt);
      if (b.furnished === 'Furnished' || b.furnished === 'Unfurnished') prop.furnished = b.furnished;
      if (b.completion === 'Ready' || b.completion === 'Off-Plan') prop.completion = b.completion;
      if (typeof b.description === 'string') prop.description = b.description.trim().slice(0, 3000);
      if (Array.isArray(b.features)) {
        prop.features = b.features.map((f: unknown) => String(f).trim()).filter(Boolean).slice(0, 20);
      }
      if (Array.isArray(b.images) && b.images.length > 0) {
        prop.images = b.images.map((s: unknown) => String(s)).slice(0, 10);
      }
      if (b.coordinates?.lat && b.coordinates?.lng) {
        prop.coordinates = { lat: Number(b.coordinates.lat), lng: Number(b.coordinates.lng) };
      }

      if (typeof b.status === 'string') {
        const nextStatus = b.status as ListingStatus;
        if (isAdmin) {
          prop.status = nextStatus;
        } else {
          // Agents cannot self-approve a pending listing to active; they can deactivate, reactivate an already approved listing, or mark sold/rented
          if (prop.status === 'pending' && nextStatus === 'active') {
            res.status(403).json({ error: 'Pending listings require administrator approval before publishing.' });
            return;
          }
          if (['active', 'inactive', 'sold', 'rented'].includes(nextStatus)) {
            prop.status = nextStatus;
          }
        }
      }

      if (isAdmin && typeof b.featured === 'boolean') {
        prop.featured = b.featured;
      }

      prop.updatedAt = new Date().toISOString();
      saveDb(db);
      res.json({ property: prop });
    }
  );

  app.delete(
    '/api/properties/:id',
    requireRoles('agent', 'admin'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const prop = db.properties.find((p) => p.id === req.params.id);
      if (!prop) {
        res.status(404).json({ error: 'Property not found.' });
        return;
      }
      if (req.currentUser!.role !== 'admin' && prop.agentId !== req.currentUser!.id) {
        res.status(403).json({ error: 'You can only delete your own listings.' });
        return;
      }
      db.properties = db.properties.filter((p) => p.id !== req.params.id);
      saveDb(db);
      res.json({ ok: true });
    }
  );

  // ---------- INQUIRIES & SELL VALUATION REQUESTS ----------
  app.post('/api/inquiries', (req: AuthedRequest, res: Response) => {
    const b = req.body || {};
    if (!b.name || !b.email || !b.phone || !b.message) {
      res.status(400).json({ error: 'Name, email, phone, and message are required.' });
      return;
    }

    const db = loadDb();
    let prop: Property | undefined;
    if (b.propertyId) {
      prop = db.properties.find((p) => p.id === b.propertyId);
      if (prop) {
        prop.inquiriesCount += 1;
      }
    }

    const defaultAgent = db.users.find((u) => u.role === 'agent' && u.active);
    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      type:
        b.type === 'sell_valuation' || b.type === 'general'
          ? b.type
          : 'property_inquiry',
      propertyId: prop?.id,
      propertyTitle: prop?.title,
      propertyRef: prop?.referenceNumber,
      agentId: prop?.agentId || b.agentId || defaultAgent?.id,
      customerId: req.currentUser?.id,
      name: String(b.name).trim().slice(0, 120),
      email: String(b.email).trim().toLowerCase().slice(0, 120),
      phone: String(b.phone).trim().slice(0, 40),
      message: String(b.message).trim().slice(0, 1500),
      sellDetails: b.sellDetails,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    db.inquiries.unshift(inquiry);
    saveDb(db);
    res.status(201).json({ inquiry });
  });

  app.get('/api/inquiries', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.currentUser!;
    let list = db.inquiries;
    if (user.role === 'customer') {
      list = list.filter(
        (i) => i.customerId === user.id || i.email.toLowerCase() === user.email.toLowerCase()
      );
    } else if (user.role === 'agent') {
      list = list.filter((i) => i.agentId === user.id);
    }
    res.json({ inquiries: list });
  });

  app.patch(
    '/api/inquiries/:id',
    requireRoles('agent', 'admin'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const inq = db.inquiries.find((i) => i.id === req.params.id);
      if (!inq) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      if (req.currentUser!.role !== 'admin' && inq.agentId !== req.currentUser!.id) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      const { status, agentNote } = req.body || {};
      if (status === 'new' || status === 'contacted' || status === 'closed') {
        inq.status = status;
      }
      if (typeof agentNote === 'string') {
        inq.agentNote = agentNote.trim().slice(0, 600);
      }
      inq.updatedAt = new Date().toISOString();
      saveDb(db);
      res.json({ inquiry: inq });
    }
  );

  // ---------- VIEWING APPOINTMENTS ----------
  app.post('/api/viewings', (req: AuthedRequest, res: Response) => {
    const b = req.body || {};
    if (!b.propertyId || !b.preferredDate || !b.preferredTime || !b.name || !b.email || !b.phone) {
      res.status(400).json({ error: 'Property, date, time, name, email, and phone are required.' });
      return;
    }
    const db = loadDb();
    const prop = db.properties.find((p) => p.id === b.propertyId);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    const agent = db.users.find((u) => u.id === prop.agentId);
    const now = new Date().toISOString();
    const viewing: ViewingRequest = {
      id: `view-${crypto.randomUUID().slice(0, 8)}`,
      propertyId: prop.id,
      propertyTitle: prop.title,
      propertyLocation: prop.location,
      propertyRef: prop.referenceNumber,
      propertyImage: prop.images[0] || '',
      agentId: prop.agentId,
      agentName: agent?.name || 'Prime Estate Advisor',
      customerId: req.currentUser?.id,
      name: String(b.name).trim().slice(0, 120),
      email: String(b.email).trim().toLowerCase().slice(0, 120),
      phone: String(b.phone).trim().slice(0, 40),
      preferredDate: String(b.preferredDate).slice(0, 20),
      preferredTime: String(b.preferredTime).slice(0, 20),
      mode: b.mode === 'Live Video' ? 'Live Video' : 'In-Person',
      notes: String(b.notes || '').trim().slice(0, 800),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    db.viewings.unshift(viewing);
    saveDb(db);
    res.status(201).json({ viewing });
  });

  app.get('/api/viewings', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.currentUser!;
    let list = db.viewings;
    if (user.role === 'customer') {
      list = list.filter(
        (v) => v.customerId === user.id || v.email.toLowerCase() === user.email.toLowerCase()
      );
    } else if (user.role === 'agent') {
      list = list.filter((v) => v.agentId === user.id);
    }
    res.json({ viewings: list });
  });

  app.patch('/api/viewings/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const viewing = db.viewings.find((v) => v.id === req.params.id);
    if (!viewing) {
      res.status(404).json({ error: 'Viewing appointment not found.' });
      return;
    }

    const user = req.currentUser!;
    const isAdmin = user.role === 'admin';
    const isAgentOwner = user.role === 'agent' && viewing.agentId === user.id;
    const isCustomerOwner =
      viewing.customerId === user.id ||
      viewing.email.toLowerCase() === user.email.toLowerCase();

    if (!isAdmin && !isAgentOwner && !isCustomerOwner) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const { status, agentNote, preferredDate, preferredTime } = req.body || {};
    if (isCustomerOwner && !isAdmin && !isAgentOwner) {
      if (status === 'cancelled') {
        viewing.status = 'cancelled';
      } else {
        res.status(403).json({ error: 'Customers may only cancel their viewing request.' });
        return;
      }
    } else {
      if (
        status === 'pending' ||
        status === 'confirmed' ||
        status === 'completed' ||
        status === 'cancelled'
      ) {
        viewing.status = status;
      }
      if (typeof agentNote === 'string') {
        viewing.agentNote = agentNote.trim().slice(0, 600);
      }
      if (typeof preferredDate === 'string' && preferredDate) {
        viewing.preferredDate = preferredDate.slice(0, 20);
      }
      if (typeof preferredTime === 'string' && preferredTime) {
        viewing.preferredTime = preferredTime.slice(0, 20);
      }
    }

    viewing.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ viewing });
  });

  // ---------- ADMIN ROUTES ----------
  app.get(
    '/api/admin/overview',
    requireRoles('admin'),
    (_req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const totalProperties = db.properties.length;
      const activeListings = db.properties.filter((p) => p.status === 'active').length;
      const pendingApprovals = db.properties.filter((p) => p.status === 'pending').length;
      const soldAndRented = db.properties.filter(
        (p) => p.status === 'sold' || p.status === 'rented'
      ).length;
      const totalCustomers = db.users.filter((u) => u.role === 'customer').length;
      const totalAgents = db.users.filter((u) => u.role === 'agent').length;
      const totalInquiries = db.inquiries.length;
      const totalViewings = db.viewings.length;
      const totalViews = db.properties.reduce((sum, p) => sum + p.views, 0);

      const monthlyStats = [
        { month: 'Jun', listings: 14, inquiries: 42, viewings: 19, closedValueM: 38.4 },
        { month: 'Jul', listings: 18, inquiries: 51, viewings: 24, closedValueM: 46.2 },
        { month: 'Aug', listings: 16, inquiries: 48, viewings: 22, closedValueM: 41.0 },
        { month: 'Sep', listings: 22, inquiries: 64, viewings: 31, closedValueM: 59.5 },
        { month: 'Oct', listings: 25, inquiries: 73, viewings: 36, closedValueM: 72.8 },
        {
          month: 'Nov',
          listings: totalProperties,
          inquiries: Math.max(totalInquiries + 58, 60),
          viewings: Math.max(totalViewings + 29, 30),
          closedValueM: 84.3,
        },
      ];

      const overview: AdminOverview = {
        totalProperties,
        activeListings,
        pendingApprovals,
        soldAndRented,
        totalCustomers,
        totalAgents,
        totalInquiries,
        totalViewings,
        totalViews,
        monthlyStats,
      };
      res.json({ overview });
    }
  );

  app.get(
    '/api/admin/users',
    requireRoles('admin'),
    (_req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const users = db.users.map((u) => ({
        ...sanitizeUser(u),
        listingsCount: db.properties.filter((p) => p.agentId === u.id).length,
      }));
      res.json({ users });
    }
  );

  app.patch(
    '/api/admin/users/:id',
    requireRoles('admin'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      const { active, verified, role } = req.body || {};
      if (typeof active === 'boolean' && user.id !== req.currentUser!.id) {
        user.active = active;
      }
      if (typeof verified === 'boolean') {
        user.verified = verified;
      }
      if (role === 'customer' || role === 'agent' || role === 'admin') {
        if (user.id !== req.currentUser!.id) {
          user.role = role;
        }
      }
      saveDb(db);
      res.json({ user: sanitizeUser(user) });
    }
  );

  app.patch(
    '/api/admin/content',
    requireRoles('admin'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const b = req.body || {};
      const fields = [
        'heroHeadline',
        'heroSubheadline',
        'featuredBannerTitle',
        'marketBrief',
        'companyPhone',
        'companyWhatsapp',
        'companyEmail',
        'officeAddress',
        'reraBrokerageId',
      ] as const;

      for (const f of fields) {
        if (typeof b[f] === 'string' && b[f].trim()) {
          db.siteContent[f] = b[f].trim().slice(0, 400);
        }
      }
      saveDb(db);
      res.json({ content: db.siteContent });
    }
  );

  // ---------- FRONTEND SERVING (DEV VITE / PROD DIST) ----------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prime Estate server listening on http://localhost:${PORT}`);
  });
}

startServer();
