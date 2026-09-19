"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getRaffleByIdForManage,
  verifyRaffleCode,
  finishRaffle,
  updateRaffleImage,
} from "@/actions/raffles";
import {
  setTicketStatus,
  releaseTicket,
  selectRandomWinner,
  selectManualWinner,
} from "@/actions/tickets";
import type { TicketFormData } from "@/components/ticket-modal";
import { TicketModal } from "@/components/ticket-modal";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDateLong } from "@/lib/dates";
import type { Raffle, RaffleStats, Ticket } from "@/types";

type Tab = "tickets" | "participants" | "winner";

function computeStats(
  tickets: Ticket[],
  numberFrom: number,
  numberTo: number,
  ticketPrice: number
): RaffleStats {
  const total = numberTo - numberFrom + 1;
  const sold = tickets.filter((t) => t.status === "sold").length;
  const reserved = tickets.filter((t) => t.status === "reserved").length;
  const available = total - sold - reserved;
  return {
    total,
    sold,
    reserved,
    available: Math.max(0, available),
    revenueSold: sold * ticketPrice,
    revenuePotential: total * ticketPrice,
  };
}

export default function ManageRafflePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const raffleId = params.id as string;

  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<Tab>("tickets");
  const [loading, setLoading] = useState(true);

  const [ticketSearch, setTicketSearch] = useState("");

  const [winnerLoading, setWinnerLoading] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [winnerError, setWinnerError] = useState("");
  const [winnerSuccess, setWinnerSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalNumber, setModalNumber] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && !codeVerified && !codeLoading) {
      (async () => {
        setCodeLoading(true);
        setCodeError("");
        const result = await verifyRaffleCode(raffleId, urlCode);
        setCodeLoading(false);
        if (result.success) {
          setVerifiedCode(urlCode);
          setCodeVerified(true);
          router.replace(`/manage/${raffleId}`);
        } else {
          setCodeError(result.error || "Codigo invalido");
        }
      })();
    }
  }, [searchParams, codeVerified, codeLoading, raffleId, router]);

  const stats = useMemo(
    () =>
      raffle
        ? computeStats(tickets, raffle.number_from, raffle.number_to, raffle.ticket_price)
        : null,
    [tickets, raffle]
  );

  useEffect(() => {
    if (!codeVerified) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getRaffleByIdForManage(raffleId);
      if (!cancelled) {
        if (result.raffle) {
          setRaffle(result.raffle);
          setTickets(result.tickets);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [codeVerified, raffleId]);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeLoading(true);
    setCodeError("");

    const result = await verifyRaffleCode(raffleId, codeInput);
    setCodeLoading(false);

    if (result.success) {
      setVerifiedCode(codeInput);
      setCodeVerified(true);
    } else {
      setCodeError(result.error || "Codigo invalido");
    }
  }

  function openModal(num: number) {
    setModalNumber(num);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalNumber(0);
  }

  async function handleModalSave(data: TicketFormData) {
    const num = modalNumber;
    const previousTickets = tickets;
    const isEdit = tickets.some((t) => t.number === num);

    // Optimistic update
    setTickets((prev) => {
      const exists = prev.some((t) => t.number === num);
      const optimisticTicket: Ticket = {
        id: isEdit ? (prev.find((t) => t.number === num)?.id ?? `optimistic-${num}`) : `optimistic-${num}`,
        raffle_id: raffleId,
        number: num,
        status: data.status,
        participant_name: data.participant_name || null,
        participant_phone: data.participant_phone || null,
        amount_paid: data.amount_paid,
        fully_paid: data.fully_paid,
        delivery_address: data.delivery_address || null,
        notes: data.notes || null,
        created_at: isEdit ? (prev.find((t) => t.number === num)?.created_at ?? new Date().toISOString()) : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (exists) {
        return prev.map((t) => (t.number === num ? optimisticTicket : t));
      }
      return [...prev, optimisticTicket];
    });

    setModalLoading(true);
    const result = await setTicketStatus(raffleId, num, data.status, {
      participant_name: data.participant_name,
      participant_phone: data.participant_phone,
      amount_paid: data.amount_paid,
      fully_paid: data.fully_paid,
      delivery_address: data.delivery_address,
      notes: data.notes,
    }, verifiedCode);
    setModalLoading(false);

    if (result.success) {
      toast("success", isEdit ? "Datos actualizados" : "Numero asignado");
      closeModal();
    } else {
      setTickets(previousTickets);
      toast("error", result.error || "Error al guardar");
    }
  }

  async function handleModalRelease() {
    const num = modalNumber;
    const previousTickets = tickets;

    // Optimistic update
    setTickets((prev) => prev.filter((t) => t.number !== num));

    setModalLoading(true);
    const result = await releaseTicket(raffleId, num, verifiedCode);
    setModalLoading(false);

    if (result.success) {
      toast("success", "Numero liberado");
      closeModal();
    } else {
      setTickets(previousTickets);
      toast("error", result.error || "Error al liberar");
    }
  }

  async function handleRandomWinner() {
    setWinnerLoading(true);
    setWinnerError("");
    setWinnerSuccess("");

    const result = await selectRandomWinner(raffleId, verifiedCode);
    setWinnerLoading(false);

    if (result.success && result.winnerNumber !== undefined) {
      setWinnerSuccess(`Ganador seleccionado: ${result.winnerNumber}`);
      toast("success", `Ganador: numero ${result.winnerNumber}`);
      setRaffle((prev) =>
        prev
          ? {
              ...prev,
              winner_number: result.winnerNumber!,
              winner_method: "random",
            }
          : prev
      );
    } else {
      setWinnerError(result.error || "Error al seleccionar ganador");
      toast("error", result.error || "Error al seleccionar ganador");
    }
  }

  async function handleManualWinner(e: React.FormEvent) {
    e.preventDefault();
    setWinnerLoading(true);
    setWinnerError("");
    setWinnerSuccess("");

    const result = await selectManualWinner(
      raffleId,
      Number(manualNumber),
      manualSource,
      verifiedCode
    );
    setWinnerLoading(false);

    if (result.success) {
      setWinnerSuccess("Ganador registrado correctamente");
      toast("success", "Ganador registrado");
      setRaffle((prev) =>
        prev
          ? {
              ...prev,
              winner_number: Number(manualNumber),
              winner_method: "manual",
              winner_source: manualSource,
            }
          : prev
      );
    } else {
      setWinnerError(result.error || "Error al registrar ganador");
      toast("error", result.error || "Error al registrar ganador");
    }
  }

  async function handleFinish() {
    if (!confirm("Estas seguro de finalizar esta rifa?")) return;
    const result = await finishRaffle(raffleId);
    if (result.success) {
      toast("success", "Rifa finalizada");
      setRaffle((prev) => (prev ? { ...prev, status: "finished" } : prev));
    } else {
      toast("error", result.error || "Error al finalizar la rifa");
    }
  }

  if (!codeVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-4">
        <Card className="w-full max-w-sm shadow-xl border-0">
          <CardContent className="py-8 px-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-orange-200">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-extrabold text-gray-900">
                Acceso a tu rifa
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa el codigo de administracion
              </p>
            </div>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="RIFA-XXXXXX"
                autoFocus
                error={codeError}
              />
              <Button
                type="submit"
                loading={codeLoading}
                className="w-full"
                size="lg"
                variant="orange"
              >
                Acceder
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Volver al inicio
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !raffle || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  const ticketMap = new Map(tickets.map((t) => [t.number, t]));
  const filteredTickets = Array.from(
    { length: raffle.number_to - raffle.number_from + 1 },
    (_, i) => raffle.number_from + i
  ).filter((n) => {
    if (!ticketSearch) return true;
    return n.toString().includes(ticketSearch);
  });

  const numberWidth = raffle.number_to.toString().length;
  const modalTicket = ticketMap.get(modalNumber) ?? null;
  const assignedTickets = tickets.filter((t) => t.participant_name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Inicio
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">
                {raffle.title}
              </h1>
              <p className="text-sm text-gray-500">
                {formatDateLong(raffle.raffle_date)} ·{" "}
                ${raffle.ticket_price.toLocaleString("es-CO")} por boleto
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/r/${raffle.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  Ver publica
                </Button>
              </a>
              <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-xl transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Imagen
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast("error", "La imagen no puede superar 5MB");
                      return;
                    }
                    toast("info", "Subiendo imagen...");
                    const result = await updateRaffleImage(raffleId, file, verifiedCode);
                    if (result.success && result.imageUrl) {
                      setRaffle((prev) => prev ? { ...prev, prize_image_url: result.imageUrl! } : prev);
                      toast("success", "Imagen actualizada");
                    } else {
                      toast("error", result.error || "Error al subir imagen");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {raffle.status === "active" && (
                <Button variant="danger" size="sm" onClick={handleFinish}>
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            {
              label: "Vendidos",
              value: stats.sold,
              color: "text-green-600",
            },
            {
              label: "Reservados",
              value: stats.reserved,
              color: "text-amber-600",
            },
            {
              label: "Disponibles",
              value: stats.available,
              color: "text-blue-600",
            },
            {
              label: "Ingresos",
              value: `$${stats.revenueSold.toLocaleString("es-CO")}`,
              color: "text-green-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-3"
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-lg font-extrabold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(
            [
              { key: "tickets" as Tab, label: "Numeros" },
              { key: "participants" as Tab, label: "Participantes" },
              { key: "winner" as Tab, label: "Ganador" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Tickets */}
        {tab === "tickets" && (
          <>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <h2 className="font-extrabold text-gray-900">Numeros</h2>
              <div className="mt-3">
                <Input
                  placeholder="Buscar numero..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-gray-100 border border-gray-200" />
                  Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200" />
                  Reservado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-green-100 border border-green-200" />
                  Vendido
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {filteredTickets.map((num) => {
                  const ticket = ticketMap.get(num);
                  const isSold = ticket?.status === "sold";
                  const isReserved = ticket?.status === "reserved";
                  const isAssigned = isSold || isReserved;

                  return (
                    <div key={num} className="group relative">
                      <button
                        onClick={() => raffle.status === "active" && openModal(num)}
                        disabled={raffle.status !== "active"}
                        className={`aspect-square w-full flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                          isSold
                            ? "bg-green-100 border border-green-200 text-green-700 hover:bg-green-200"
                            : isReserved
                            ? "bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200"
                            : raffle.status === "active"
                            ? "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                            : "bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <span>
                          {num.toString().padStart(numberWidth, "0")}
                        </span>
                        {isAssigned && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSold ? "bg-green-500" : "bg-amber-500"
                            }`}
                          />
                        )}
                      </button>

                      {/* Tooltip with participant name */}
                      {isAssigned && ticket?.participant_name && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {ticket.participant_name}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Modal */}
          {raffle.status === "active" && (
            <TicketModal
              isOpen={modalOpen}
              number={modalNumber}
              numberWidth={numberWidth}
              ticket={modalTicket}
              ticketPrice={raffle.ticket_price}
              onSave={handleModalSave}
              onRelease={handleModalRelease}
              onClose={closeModal}
              loading={modalLoading}
            />
          )}
          </>
        )}

        {/* Tab: Participants */}
        {tab === "participants" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900">Participantes</h2>
                {assignedTickets.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const headers = ["Numero", "Nombre", "Telefono", "Pagado", "Completo", "Direccion", "Notas", "Estado"];
                      const rows = assignedTickets.map((t) => [
                        t.number.toString().padStart(numberWidth, "0"),
                        t.participant_name || "",
                        t.participant_phone || "",
                        `$${(t.amount_paid || 0).toLocaleString("es-CO")}`,
                        t.fully_paid ? "Si" : "No",
                        t.delivery_address || "",
                        t.notes || "",
                        t.status === "sold" ? "Vendido" : "Reservado",
                      ]);
                      const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `participantes-${raffle.title.toLowerCase().replace(/\s+/g, "-")}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast("success", "CSV exportado");
                    }}
                  >
                    Exportar CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedTickets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay participantes registrados
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Numero</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Telefono</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Pagado</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Direccion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTickets.map((t) => (
                        <tr key={t.number} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openModal(t.number)}>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            {t.number.toString().padStart(numberWidth, "0")}
                          </td>
                          <td className="py-2.5 px-3 font-medium">{t.participant_name || "-"}</td>
                          <td className="py-2.5 px-3 text-gray-500">{t.participant_phone || "-"}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            ${(t.amount_paid || 0).toLocaleString("es-CO")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              t.fully_paid
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {t.fully_paid ? "Pagado" : "Pendiente"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs hidden sm:table-cell">{t.delivery_address || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Winner */}
        {tab === "winner" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <h2 className="font-extrabold text-gray-900">
                Determinar ganador
              </h2>
            </CardHeader>
            <CardContent>
              {raffle.winner_number !== null ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-xl shadow-orange-200">
                    <span className="text-4xl font-extrabold text-white">
                      {raffle.winner_number
                        .toString()
                        .padStart(numberWidth, "0")}
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-gray-900">
                    Numero ganador:{" "}
                    {raffle.winner_number
                      .toString()
                      .padStart(numberWidth, "0")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Metodo:{" "}
                    {raffle.winner_method === "random"
                      ? "Aleatorio"
                      : "Manual"}
                  </p>
                  {raffle.winner_source && (
                    <p className="text-sm text-gray-500 mt-1">
                      Fuente: {raffle.winner_source}
                    </p>
                  )}
                </div>
              ) : raffle.status !== "active" ? (
                <p className="text-center text-gray-500 py-8">
                  La rifa no esta activa
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2">
                      Seleccion aleatoria
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Seleccionar un numero ganador aleatoriamente de entre los{" "}
                      {stats.sold} numeros vendidos.
                    </p>
                    <Button
                      onClick={handleRandomWinner}
                      loading={winnerLoading}
                      className="w-full"
                      variant="orange"
                    >
                      Seleccionar ganador aleatorio
                    </Button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2">
                      Ingreso manual
                    </h3>
                    <form
                      onSubmit={handleManualWinner}
                      className="space-y-3"
                    >
                      <Input
                        label="Numero ganador"
                        type="number"
                        min={raffle.number_from}
                        max={raffle.number_to}
                        value={manualNumber}
                        onChange={(e) => setManualNumber(e.target.value)}
                        placeholder={`Entre ${raffle.number_from} y ${raffle.number_to}`}
                        required
                      />
                      <Textarea
                        label="Fuente / Referencia"
                        value={manualSource}
                        onChange={(e) => setManualSource(e.target.value)}
                        placeholder="Ej: Resultado de la Loteria X - 30/09/2026"
                        rows={2}
                        required
                      />
                      <Button
                        type="submit"
                        loading={winnerLoading}
                        className="w-full"
                        variant="orange"
                      >
                        Registrar ganador
                      </Button>
                    </form>
                  </div>

                  {winnerError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {winnerError}
                    </div>
                  )}
                  {winnerSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                      {winnerSuccess}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
