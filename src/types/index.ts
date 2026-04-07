export type Role = 'buyer' | 'seller' | 'admin';
export type Condition = '0km' | 'usado';
export type VehicleType = 'auto' | 'moto' | 'barco';
export type AutoCategory = 'sedan' | 'suv' | 'pickup' | 'hatchback' | 'coupe' | 'van' | 'camion';
export type MotoCategory = 'scooter' | 'street' | 'sport' | 'touring' | 'adventure' | 'custom' | 'trail' | 'cuatriciclo';
export type BarcoCategory = 'lancha' | 'velero' | 'yate' | 'jetski' | 'bote' | 'pesquero';
export type Category = AutoCategory | MotoCategory | BarcoCategory;
export type Fuel = 'nafta' | 'diesel' | 'hibrido' | 'electrico' | '2t';
export type Transmission = 'manual' | 'automatico' | 'cvt';
export type ListingStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'reserved' | 'sold';
export type BoostTier = 'free' | 'silver' | 'gold';
export type InspectionStatus = 'none' | 'pending' | 'approved' | 'rejected';

// ─── Catálogo ───
export interface Brand { id: string; name: string; logo_url: string; country: string; vehicle_types: VehicleType[]; }
export interface Model { id: string; brand_id: string; name: string; category: Category; vehicle_type: VehicleType; year_start: number; year_end: number | null; }
export interface Trim { id: string; model_id: string; name: string; engine_cc: number; horsepower: number; fuel: Fuel; transmission: Transmission; doors?: number; }

// ─── Equipment ───
export interface EquipmentItem { key: string; label: string; checked: boolean; }

// ─── Boost Engine ───
export interface BoostPackage { id: string; name: string; tier: BoostTier; price_usd: number; duration_days: number; weight: number; auto_bump: boolean; max_photos: number; badge_label: string; active: boolean; }
export interface BoostPurchase { id: string; dealer_id: string; package_id: string; listing_id: string; credits_used: number; activated_at: string; expires_at: string; created_at: string; }

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  avatar_url: string;
  bio: string;
  city: string;
  document_verified: boolean;
  subscription_tier?: string;
  created_at: string;
  birth_date?: string;
  nationality?: string;
  state?: string;
  postal_code?: string;
}

export interface Dealership {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string;
  address: string;
  city: string;
  verified: boolean;
  approved: boolean;
  plan: 'free' | 'premium';
  description: string;
  phone: string;
  whatsapp: string;
  website: string;
  ruc: string;
  created_at: string;
  avg_rating?: number;
  review_count?: number;
}

// ─── Documentos de Verificação ───
export type DocumentType = 'ci_frente' | 'ci_verso' | 'ruc_doc';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string;
  status: DocumentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: Profile;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  url: string;
  order_index: number;
  is_cover: boolean;
}

export interface Listing {
  id: string;
  seller_id: string;
  dealership_id: string | null;
  dealership?: Dealership;
  vehicle_type: VehicleType;
  title: string;
  brand: string;
  model: string;
  year: number;
  version: string;
  condition: Condition;
  category: Category;
  fuel: Fuel;
  transmission: Transmission;
  mileage: number;
  price_usd: number;
  color: string;
  doors: number;
  description: string;
  city: string;
  department: string;
  whatsapp_contact: string;
  status: ListingStatus;
  featured: boolean;
  views_count: number;
  photos: ListingPhoto[];
  // Enterprise fields (optional — may not exist on legacy/mock data)
  trim_id?: string | null;
  trim?: Trim;
  color_ext?: string;
  color_int?: string;
  plate_masked?: string;
  equipment?: Record<string, boolean>;
  inspection_status?: InspectionStatus;
  inspection_url?: string;
  reserved_until?: string | null;
  tier?: BoostTier;
  quality_score?: number;
  last_bump_at?: string;
  boost_expires_at?: string | null;
  // Moto-specific fields
  engine_cc?: number;
  brake_type?: string;
  starter?: 'electrica' | 'kick' | 'ambas';
  cooling?: 'aire' | 'liquida';
  // Barco-specific fields
  length_ft?: number;
  engine_hp?: number;
  hours_used?: number;
  hull_material?: 'fibra' | 'aluminio' | 'madera' | 'inflable' | 'acero';
  passenger_capacity?: number;
  // Custom brand
  custom_brand?: string;
  is_custom_brand?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface HighlightPlan {
  id: string;
  name: string;
  price_usd: number;
  duration_days: number;
  max_photos: number;
  badge_color: string;
}

// ─── Leads / CRM ───
export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'test_drive' | 'sold' | 'lost';
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadSource = 'whatsapp' | 'phone' | 'email' | 'form';
export type InteractionType = 'call' | 'whatsapp' | 'email' | 'note' | 'visit';

export interface Lead {
  id: string;
  listing_id: string;
  dealer_id: string | null;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  source: LeadSource;
  status: LeadStatus;
  temperature: LeadTemperature;
  expected_close_date: string | null;
  deal_value: number | null;
  loss_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
  listing?: Listing;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  type: InteractionType;
  outcome: string;
  next_action_date: string | null;
  content: string;
  created_by: string;
  created_at: string;
}

// ─── Chat ───
export interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  last_message_preview: string;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
  listing?: Partial<Listing>;
  buyer?: Partial<Profile>;
  seller?: Partial<Profile>;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

// ─── Notifications ───
export type NotificationType = 'new_lead' | 'listing_approved' | 'listing_rejected' | 'dealer_approved' | 'lead_status_change' | 'boost_expired' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// ─── Analytics ───
export type AnalyticsEventType = 'view' | 'contact_click' | 'whatsapp_click' | 'phone_click' | 'share' | 'favorite' | 'gallery_view' | 'test_drive_request' | 'finance_calc';

export interface AnalyticsEvent {
  id: string;
  listing_id: string;
  dealer_id: string | null;
  event_type: AnalyticsEventType;
  viewer_id: string | null;
  created_at: string;
}

// ─── KPIs (computados) ───
export interface SystemKPIs {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalUsers: number;
  totalDealers: number;
  totalLeads: number;
  leadsLast7d: number;
  viewsLast7d: number;
}

export interface DealerKPIs {
  totalInventory: number;
  activeInventory: number;
  totalLeads: number;
  newLeadsToday: number;
  leadsLast7d: number;
  avgInventoryAgeDays: number;
  featuredPercentage: number;
  ctrByListing: { listingId: string; title: string; views: number; clicks: number; ctr: number }[];
}

// ─── Dealer Hours ───
export interface DealerHours {
  id: string;
  dealer_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

// ─── Filters ───
export interface FilterState {
  vehicleType: VehicleType;
  brand: string;
  condition: string;
  category: string;
  fuel: string;
  transmission: string;
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  mileageMax: number | null;
  city: string;
  search: string;
  tier: string;
  inspected: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'recent';
}

// ─── Reviews ───
export interface Review {
  id: string;
  user_id: string;
  dealer_id: string | null;
  seller_id: string | null;
  listing_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  profile?: Profile;
}

// ─── Hero Slides ───
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  text_theme: 'dark' | 'light';
  desktop_url: string;
  tablet_url: string;
  mobile_url: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Payments ───
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  boost_purchase_id: string | null;
  stripe_session_id: string;
  stripe_payment_intent: string;
  amount_usd: number;
  status: PaymentStatus;
  created_at: string;
}
