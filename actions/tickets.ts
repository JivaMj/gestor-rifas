"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { setTicketStatusSchema, releaseTicketSchema } from "@/schemas/raffle";
export async function setTicketStatus(
  raffleId: string,
  number: number,
  status: "reserved" | "sold"
): Promise<{ success: boolean; error?: string }> {
  const parsed = setTicketStatusSchema.safeParse({ raffle_id: raffleId, number, status });
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const supabase = getSupabaseAdminClient();

  // Check raffle status
  const { data: raffle } = await supabase
    .from("raffles")
    .select("status, number_from, number_to, slug")
    .eq("id", raffleId)
    .single();

  if (!raffle || raffle.status !== "active") {
    return { success: false, error: "La rifa no está activa" };
  }

  if (number < raffle.number_from || number > raffle.number_to) {
    return { success: false, error: "El número está fuera del rango" };
  }

  // Upsert: if ticket exists, update status; if not, insert
  const { error } = await supabase
    .from("tickets")
    .upsert(
      { raffle_id: raffleId, number, status },
      { onConflict: "raffle_id,number" }
    );

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Este número ya fue asignado" };
    }
    return { success: false, error: "No fue posible actualizar el número" };
  }

  revalidatePath(`/admin/rifa/${raffleId}`);
  revalidatePath(`/r/${raffle.slug}`);

  return { success: true };
}

export async function releaseTicket(
  raffleId: string,
  number: number
): Promise<{ success: boolean; error?: string }> {
  const parsed = releaseTicketSchema.safeParse({ raffle_id: raffleId, number });
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const supabase = getSupabaseAdminClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select("slug")
    .eq("id", raffleId)
    .single();

  const { error } = await supabase
    .from("tickets")
    .delete()
    .eq("raffle_id", raffleId)
    .eq("number", number);

  if (error) {
    return { success: false, error: "No fue posible liberar el número" };
  }

  revalidatePath(`/admin/rifa/${raffleId}`);
  if (raffle) revalidatePath(`/r/${raffle.slug}`);

  return { success: true };
}

export async function selectRandomWinner(
  raffleId: string
): Promise<{ success: boolean; winnerNumber?: number; error?: string }> {
  const supabase = getSupabaseAdminClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select("*")
    .eq("id", raffleId)
    .single();

  if (!raffle || raffle.status !== "active") {
    return { success: false, error: "La rifa no está activa" };
  }

  if (raffle.winner_number !== null) {
    return { success: false, error: "Ya se ha determinado un ganador" };
  }

  const { data: soldTickets } = await supabase
    .from("tickets")
    .select("number")
    .eq("raffle_id", raffleId)
    .eq("status", "sold");

  if (!soldTickets || soldTickets.length === 0) {
    return { success: false, error: "No hay números vendidos para seleccionar" };
  }

  const randomIndex = Math.floor(Math.random() * soldTickets.length);
  const winnerNumber = soldTickets[randomIndex].number;

  const { error } = await supabase
    .from("raffles")
    .update({
      winner_method: "random",
      winner_number: winnerNumber,
      winner_source: "Selección aleatoria del sistema",
      status: "finished",
    })
    .eq("id", raffleId);

  if (error) {
    return { success: false, error: "No fue posible seleccionar el ganador" };
  }

  revalidatePath(`/admin/rifa/${raffleId}`);
  revalidatePath(`/r/${raffle.slug}`);

  return { success: true, winnerNumber };
}

export async function selectManualWinner(
  raffleId: string,
  winnerNumber: number,
  source: string
): Promise<{ success: boolean; error?: string }> {
  if (!source.trim()) {
    return { success: false, error: "La fuente/referencia es requerida" };
  }

  const supabase = getSupabaseAdminClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select("*")
    .eq("id", raffleId)
    .single();

  if (!raffle || raffle.status !== "active") {
    return { success: false, error: "La rifa no está activa" };
  }

  if (raffle.winner_number !== null) {
    return { success: false, error: "Ya se ha determinado un ganador" };
  }

  if (winnerNumber < raffle.number_from || winnerNumber > raffle.number_to) {
    return { success: false, error: "El número ganador está fuera del rango" };
  }

  // Verify the number is sold
  const { data: ticket } = await supabase
    .from("tickets")
    .select("number")
    .eq("raffle_id", raffleId)
    .eq("number", winnerNumber)
    .eq("status", "sold")
    .single();

  if (!ticket) {
    return {
      success: false,
      error: "El número ganador debe pertenecer a los números vendidos",
    };
  }

  const { error } = await supabase
    .from("raffles")
    .update({
      winner_method: "manual",
      winner_number: winnerNumber,
      winner_source: source,
      status: "finished",
    })
    .eq("id", raffleId);

  if (error) {
    return { success: false, error: "No fue posible registrar el ganador" };
  }

  revalidatePath(`/admin/rifa/${raffleId}`);
  revalidatePath(`/r/${raffle.slug}`);

  return { success: true };
}
