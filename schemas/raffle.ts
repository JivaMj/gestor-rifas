import { z } from "zod";

export const createRaffleSchema = z
  .object({
    title: z
      .string()
      .min(1, "El premio es requerido")
      .max(200, "Máximo 200 caracteres"),
    description: z.string().max(2000, "Máximo 2000 caracteres").optional(),
    raffle_date: z.string().min(1, "La fecha es requerida"),
    terms: z.string().max(5000, "Máximo 5000 caracteres").optional(),
    number_from: z
      .number({ message: "Debe ser un número" })
      .int("Debe ser un número entero")
      .min(0, "Mínimo 0"),
    number_to: z
      .number({ message: "Debe ser un número" })
      .int("Debe ser un número entero")
      .min(0, "Mínimo 0"),
    ticket_price: z
      .number({ message: "Debe ser un número" })
      .min(0.01, "El precio debe ser mayor a 0"),
    whatsapp: z
      .string()
      .min(1, "El número de WhatsApp es requerido")
      .regex(/^\+?[\d\s\-()]+$/, "Formato de WhatsApp inválido"),
    winner_method: z.enum(["random", "manual"], {
      message: "Método inválido",
    }),
  })
  .refine((data) => data.number_from < data.number_to, {
    message: "El número inicial debe ser menor que el número final",
    path: ["number_to"],
  });

export type CreateRaffleInput = z.infer<typeof createRaffleSchema>;

export const verifyMasterCodeSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
});

export const verifyRaffleCodeSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
});

export const updateRaffleSchema = z
  .object({
    title: z
      .string()
      .min(1, "El premio es requerido")
      .max(200, "Máximo 200 caracteres")
      .optional(),
    description: z.string().max(2000, "Máximo 2000 caracteres").optional(),
    raffle_date: z.string().min(1, "La fecha es requerida").optional(),
    terms: z.string().max(5000, "Máximo 5000 caracteres").optional(),
    number_from: z.number().int().min(0).optional(),
    number_to: z.number().int().min(0).optional(),
    ticket_price: z.number().min(0.01).optional(),
    whatsapp: z
      .string()
      .regex(/^\+?[\d\s\-()]+$/)
      .optional(),
    winner_method: z.enum(["random", "manual"]).optional(),
    status: z.enum(["active", "finished", "cancelled"]).optional(),
  })
  .refine(
    (data) => {
      if (data.number_from !== undefined && data.number_to !== undefined) {
        return data.number_from < data.number_to;
      }
      return true;
    },
    {
      message: "El número inicial debe ser menor que el número final",
      path: ["number_to"],
    }
  );

export type UpdateRaffleInput = z.infer<typeof updateRaffleSchema>;

export const setTicketStatusSchema = z.object({
  raffle_id: z.string().uuid(),
  number: z.number().int().min(0),
  status: z.enum(["reserved", "sold"]),
});

export const releaseTicketSchema = z.object({
  raffle_id: z.string().uuid(),
  number: z.number().int().min(0),
});

export const selectWinnerSchema = z.object({
  raffle_id: z.string().uuid(),
  winner_number: z.number().int().min(0),
  winner_source: z.string().optional(),
});
