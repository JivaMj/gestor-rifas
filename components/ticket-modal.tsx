"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Ticket } from "@/types";

interface TicketModalProps {
  isOpen: boolean;
  number: number;
  numberWidth: number;
  ticket: Ticket | null;
  ticketPrice: number;
  onSave: (data: TicketFormData) => void;
  onRelease: () => void;
  onClose: () => void;
  loading: boolean;
}

export interface TicketFormData {
  status: "reserved" | "sold";
  participant_name: string;
  participant_phone: string;
  amount_paid: number;
  fully_paid: boolean;
  delivery_address: string;
  notes: string;
}

function buildInitialFormData(ticket: Ticket | null, ticketPrice: number): TicketFormData {
  if (ticket) {
    return {
      status: ticket.status,
      participant_name: ticket.participant_name || "",
      participant_phone: ticket.participant_phone || "",
      amount_paid: ticket.amount_paid || 0,
      fully_paid: ticket.fully_paid || false,
      delivery_address: ticket.delivery_address || "",
      notes: ticket.notes || "",
    };
  }
  return {
    status: "sold",
    participant_name: "",
    participant_phone: "",
    amount_paid: ticketPrice,
    fully_paid: false,
    delivery_address: "",
    notes: "",
  };
}

export function TicketModal({
  isOpen,
  number,
  numberWidth,
  ticket,
  ticketPrice,
  onSave,
  onRelease,
  onClose,
  loading,
}: TicketModalProps) {
  const isAssigned = ticket !== null;
  const [isEditing, setIsEditing] = useState(!isAssigned);

  const [formData, setFormData] = useState<TicketFormData>(() =>
    buildInitialFormData(ticket, ticketPrice)
  );

  const prevNumberRef = useRef(number);
  const prevTicketIdRef = useRef(ticket?.id ?? null);

  useEffect(() => {
    if (!isOpen) return;
    const ticketChanged = prevTicketIdRef.current !== (ticket?.id ?? null);
    const numberChanged = prevNumberRef.current !== number;
    if (ticketChanged || numberChanged) {
      setFormData(buildInitialFormData(ticket, ticketPrice));
      setIsEditing(!ticket);
      prevNumberRef.current = number;
      prevTicketIdRef.current = ticket?.id ?? null;
    }
  }, [isOpen, number, ticket, ticketPrice]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  function handleFullyPaidToggle() {
    setFormData((prev) => ({
      ...prev,
      fully_paid: !prev.fully_paid,
      amount_paid: !prev.fully_paid ? ticketPrice : prev.amount_paid,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Numero{" "}
              {number.toString().padStart(numberWidth, "0")}
            </h2>
            <p className="text-sm text-gray-500">
              {isAssigned
                ? isEditing
                  ? "Editando datos"
                  : "Datos del participante"
                : "Asignar numero"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status selector - only for new assignments */}
          {!isAssigned && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, status: "sold" }))
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  formData.status === "sold"
                    ? "bg-green-50 border-green-400 text-green-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Vender
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, status: "reserved" }))
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  formData.status === "reserved"
                    ? "bg-amber-50 border-amber-400 text-amber-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Reservar
              </button>
            </div>
          )}

          {/* Status badge for assigned tickets */}
          {isAssigned && !isEditing && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                ticket.status === "sold"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ticket.status === "sold" ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              {ticket.status === "sold" ? "Vendido" : "Reservado"}
            </div>
          )}

          {/* Participant name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Nombre del participante
            </label>
            <Input
              value={formData.participant_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  participant_name: e.target.value,
                }))
              }
              placeholder="Nombre completo"
              disabled={!isEditing}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Telefono
            </label>
            <Input
              value={formData.participant_phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  participant_phone: e.target.value,
                }))
              }
              placeholder="Ej: 300 123 4567"
              disabled={!isEditing}
            />
          </div>

          {/* Payment */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Pago
              </label>
              {isEditing && (
                <span className="text-xs text-gray-500">
                  Precio: ${ticketPrice.toLocaleString("es-CO")}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cuanto pago
              </label>
              <Input
                type="number"
                min={0}
                step={100}
                value={formData.amount_paid}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount_paid: Number(e.target.value),
                  }))
                }
                disabled={!isEditing}
              />
            </div>

            <button
              type="button"
              onClick={isEditing ? handleFullyPaidToggle : undefined}
              disabled={!isEditing}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                formData.fully_paid
                  ? "bg-green-50 border-green-400"
                  : "bg-white border-gray-200"
              } ${isEditing ? "cursor-pointer hover:border-green-300" : "cursor-default"}`}
            >
              <span className="text-sm font-semibold text-gray-700">
                Pago completo
              </span>
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  formData.fully_paid ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    formData.fully_paid ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Delivery address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Direccion de entrega
            </label>
            <Textarea
              value={formData.delivery_address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  delivery_address: e.target.value,
                }))
              }
              placeholder="Direccion donde se entraga el premio"
              rows={2}
              disabled={!isEditing}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Notas
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notas adicionales (opcional)"
              rows={2}
              disabled={!isEditing}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isAssigned && !isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={onRelease}
                  disabled={loading}
                >
                  Cancelar asignacion
                </Button>
                <Button
                  type="button"
                  variant="orange"
                  className="flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="orange"
                  className="flex-1"
                  loading={loading}
                >
                  {isAssigned ? "Guardar" : "Asignar"}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
