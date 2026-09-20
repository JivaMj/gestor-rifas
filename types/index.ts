export type RaffleStatus = "active" | "finished" | "cancelled";
export type WinnerMethod = "random" | "manual";
export type TicketStatus = "reserved" | "sold";
export type PaymentType = "immediate" | "scheduled";
export type FiadoStatus = "active" | "inactive";

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
  admin_code_hash: string;
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
  admin_code_hash: string;
  status: FiadoStatus;
  created_at: string;
  updated_at: string;
}
