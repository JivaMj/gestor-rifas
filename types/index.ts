export type RaffleStatus = "active" | "finished" | "cancelled";
export type WinnerMethod = "random" | "manual";
export type TicketStatus = "reserved" | "sold";
export type PaymentType = "immediate" | "scheduled";
export type FiadoStatus = "active" | "inactive";
export type PromotionStatus = "active" | "inactive";

export interface User {
  id: string;
  email: string;
  name: string;
  business_type: string | null;
  location: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Raffle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prize_image_url: string | null;
  raffle_date: string;
  terms: string | null;
  number_from: number;
  number_to: number;
  ticket_price: number;
  whatsapp: string;
  winner_method: WinnerMethod;
  winner_number: number | null;
  winner_source: string | null;
  owner_id: string | null;
  status: RaffleStatus;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  raffle_id: string;
  number: number;
  status: TicketStatus;
  participant_name: string | null;
  participant_phone: string | null;
  amount_paid: number;
  fully_paid: boolean;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RaffleStats {
  total: number;
  sold: number;
  reserved: number;
  available: number;
  revenueSold: number;
  revenuePotential: number;
}

export interface CreationCode {
  id: string;
  code: string;
  used_by_raffle_id: string | null;
  created_at: string;
  used_at: string | null;
}

export interface Fiado {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  payment_type: PaymentType;
  payment_date: string | null;
  whatsapp: string;
  discount_info: string | null;
  owner_id: string | null;
  status: FiadoStatus;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  availability: string | null;
  address: string | null;
  conditions: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  owner_id: string | null;
  status: PromotionStatus;
  created_at: string;
  updated_at: string;
}
