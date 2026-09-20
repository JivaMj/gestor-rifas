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
  participant_name: z.string().max(200).optional(),
  participant_phone: z.string().max(50).optional(),
  amount_paid: z.number().min(0).optional(),
  fully_paid: z.boolean().optional(),
  delivery_address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
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

export const createFiadoSchema = z
  .object({
    title: z
      .string()
      .min(1, "El nombre del producto/servicio es requerido")
      .max(200, "Maximo 200 caracteres"),
    description: z.string().max(2000, "Maximo 2000 caracteres").optional(),
    price: z
      .number({ message: "Debe ser un numero" })
      .min(0.01, "El precio debe ser mayor a 0"),
    payment_type: z.enum(["immediate", "scheduled"], {
      message: "Tipo de pago invalido",
    }),
    payment_date: z.string().optional(),
    whatsapp: z
      .string()
      .min(1, "El numero de WhatsApp es requerido")
      .regex(/^\+?[\d\s\-()]+$/, "Formato de WhatsApp invalido"),
    discount_info: z.string().max(500, "Maximo 500 caracteres").optional(),
  })
  .refine(
    (data) => {
      if (data.payment_type === "scheduled" && !data.payment_date) {
        return false;
      }
      return true;
    },
    {
      message: "La fecha de pago es requerida cuando el pago no es inmediato",
      path: ["payment_date"],
    }
  );

export type CreateFiadoInput = z.infer<typeof createFiadoSchema>;

export const updateFiadoSchema = z.object({
  title: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Maximo 200 caracteres")
    .optional(),
  description: z.string().max(2000, "Maximo 2000 caracteres").optional(),
  price: z.number().min(0.01).optional(),
  payment_type: z.enum(["immediate", "scheduled"]).optional(),
  payment_date: z.string().optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/)
    .optional(),
  discount_info: z.string().max(500).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateFiadoInput = z.infer<typeof updateFiadoSchema>;

export const verifyFiadoCodeSchema = z.object({
  code: z.string().min(1, "El codigo es requerido"),
});

export const createPromotionSchema = z.object({
  title: z
    .string()
    .min(1, "El nombre de la promocion es requerido")
    .max(200, "Maximo 200 caracteres"),
  description: z.string().max(2000, "Maximo 2000 caracteres").optional(),
  availability: z.string().max(500, "Maximo 500 caracteres").optional(),
  address: z.string().max(500, "Maximo 500 caracteres").optional(),
  conditions: z.string().max(2000, "Maximo 2000 caracteres").optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[\d\s\-()]*$/, "Formato de WhatsApp invalido")
    .optional()
    .or(z.literal("")),
  facebook: z.string().url("URL invalida").optional().or(z.literal("")),
  instagram: z.string().url("URL invalida").optional().or(z.literal("")),
  tiktok: z.string().url("URL invalida").optional().or(z.literal("")),
  website: z.string().url("URL invalida").optional().or(z.literal("")),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = z.object({
  title: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Maximo 200 caracteres")
    .optional(),
  description: z.string().max(2000, "Maximo 2000 caracteres").optional(),
  availability: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  conditions: z.string().max(2000).optional(),
  whatsapp: z.string().regex(/^\+?[\d\s\-()]*$/).optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

export const verifyPromotionCodeSchema = z.object({
  code: z.string().min(1, "El codigo es requerido"),
});
