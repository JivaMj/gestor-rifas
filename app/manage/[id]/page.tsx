"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getRaffleById,
  verifyRaffleCode,
  finishRaffle,
} from "@/actions/raffles";
import {
  setTicketStatus,
  releaseTicket,
  selectRandomWinner,
  selectManualWinner,
} from "@/actions/tickets";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDateLong } from "@/lib/dates";
import type { Raffle, RaffleStats, Ticket } from "@/types";

type Tab = "tickets" | "winner";

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
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<Tab>("tickets");
  const [loading, setLoading] = useState(true);

  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketActionLoading, setTicketActionLoading] = useState<number | null>(
    null
  );

  const [winnerLoading, setWinnerLoading] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [winnerError, setWinnerError] = useState("");
  const [winnerSuccess, setWinnerSuccess] = useState("");

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && !codeVerified && !codeLoading) {
      (async () => {
        setCodeLoading(true);
        setCodeError("");
        const result = await verifyRaffleCode(raffleId, urlCode);
        setCodeLoading(false);
        if (result.success) {
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
      const result = await getRaffleById(raffleId);
      if (!cancelled) {
        if (result.raffle) {
          setRaffle(result.raffle);
          setTickets(result.tickets as Ticket[]);
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
      setCodeVerified(true);
    } else {
      setCodeError(result.error || "Codigo invalido");
    }
  }

  async function handleTicketAction(
    number: number,
    action: "sold" | "reserved" | "release"
  ) {
    const previousTickets = tickets;

    const newStatus = action === "release" ? null : action;

    setTickets((prev) => {
      const exists = prev.some((t) => t.number === number);
      if (exists) {
        if (newStatus === null) {
          return prev.filter((t) => t.number !== number);
        }
        return prev.map((t) =>
          t.number === number ? { ...t, status: newStatus } : t
        );
      }
      if (newStatus) {
        return [
          ...prev,
          {
            id: `optimistic-${number}`,
            raffle_id: raffleId,
            number,
            status: newStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      return prev;
    });

    setTicketActionLoading(number);

    let result;
    if (action === "release") {
      result = await releaseTicket(raffleId, number);
    } else {
      result = await setTicketStatus(raffleId, number, action);
    }

    setTicketActionLoading(null);

    if (result.success) {
      const labels = {
        sold: "marcado como vendido",
        reserved: "reservado",
        release: "liberado",
      };
      toast("success", `Numero ${labels[action]}`);
    } else {
      setTickets(previousTickets);
      toast("error", result.error || "Error al actualizar numero");
    }
  }

  async function handleRandomWinner() {
    setWinnerLoading(true);
    setWinnerError("");
    setWinnerSuccess("");

    const result = await selectRandomWinner(raffleId);
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
      manualSource
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

  const ticketMap = new Map(tickets.map((t) => [t.number, t.status]));
  const filteredTickets = Array.from(
    { length: raffle.number_to - raffle.number_from + 1 },
    (_, i) => raffle.number_from + i
  ).filter((n) => {
    if (!ticketSearch) return true;
    return n.toString().includes(ticketSearch);
  });

  const numberWidth = raffle.number_to.toString().length;

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
                  const status = ticketMap.get(num);
                  const isSold = status === "sold";
                  const isReserved = status === "reserved";
                  const isLoading = ticketActionLoading === num;

                  return (
                    <div key={num} className="group relative">
                      <div
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                          isSold
                            ? "bg-green-100 border border-green-200 text-green-700"
                            : isReserved
                            ? "bg-amber-100 border border-amber-200 text-amber-700"
                            : "bg-gray-50 border border-gray-200 text-gray-600 group-hover:bg-gray-100"
                        }`}
                      >
                        {isLoading ? (
                          <svg
                            className="animate-spin h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <>
                            <span className="group-hover:hidden">
                              {num.toString().padStart(numberWidth, "0")}
                            </span>
                            {raffle.status === "active" && (
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                {!isSold && (
                                  <button
                                    onClick={() =>
                                      handleTicketAction(num, "sold")
                                    }
                                    className="p-0.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                                    title="Vender"
                                  >
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2.5}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {!isReserved && (
                                  <button
                                    onClick={() =>
                                      handleTicketAction(num, "reserved")
                                    }
                                    className="p-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                    title="Reservar"
                                  >
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2.5}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {(isSold || isReserved) && (
                                  <button
                                    onClick={() =>
                                      handleTicketAction(num, "release")
                                    }
                                    className="p-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    title="Liberar"
                                  >
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2.5}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
