"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutMaster } from "@/actions/auth";
import { getRaffles, regenerateAdminCode } from "@/actions/raffles";
import { getCreationCodes, generateCode } from "@/actions/codes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatDateLong } from "@/lib/dates";
import type { Raffle, CreationCode } from "@/types";

type Tab = "codes" | "raffles";

export default function AdminRifasPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [codes, setCodes] = useState<CreationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<Tab>("codes");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [showRaffleData, setShowRaffleData] = useState<string | null>(null);
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);
  const [raffleAdminCodes, setRaffleAdminCodes] = useState<
    Record<string, string>
  >({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [r, c] = await Promise.all([getRaffles(), getCreationCodes()]);
      setRaffles(r);
      setCodes(c);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await logoutMaster();
    router.push("/admin");
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateCode();
    setGenerating(false);

    if (result.success && result.code) {
      setNewCode(result.code);
      toast("success", "Codigo generado");
      const updated = await getCreationCodes();
      setCodes(updated);
    } else {
      toast("error", result.error || "Error al generar codigo");
    }
  }

  async function handleRegenerateCode(raffleId: string) {
    setRegeneratingCode(raffleId);
    const result = await regenerateAdminCode(raffleId);
    setRegeneratingCode(null);

    if (result.success && result.code) {
      setRaffleAdminCodes((prev) => ({ ...prev, [raffleId]: result.code! }));
      toast("success", "Codigo regenerado. Guardalo, no se podra volver a ver.");
    } else {
      toast("error", result.error || "Error al regenerar codigo");
    }
  }

  const raffleMap = new Map(raffles.map((r) => [r.id, r]));
  const usedCodes = codes.filter((c) => c.used_by_raffle_id);
  const unusedCodes = codes.filter((c) => !c.used_by_raffle_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
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
                Panel administrativo
              </h1>
              <p className="text-sm text-gray-500">
                {codes.length} codigo{codes.length !== 1 ? "s" : ""} ·{" "}
                {raffles.length} rifa{raffles.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleGenerate} loading={generating}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Generar codigo
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {([
            { key: "codes" as Tab, label: "Codigos" },
            { key: "raffles" as Tab, label: "Rifas" },
          ]).map((t) => (
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

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <>
            {/* Tab: Codes */}
            {tab === "codes" && (
              <div className="space-y-6">
                {/* New code alert */}
                {newCode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                      Código generado
                    </p>
                    <p className="text-3xl font-mono font-bold text-amber-900 mb-2">
                      {newCode}
                    </p>
                    <p className="text-xs text-amber-700">
                      Comparte este código con la persona que creará la rifa. Úsalo en{" "}
                      <span className="font-mono">/create</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => setNewCode(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                )}

                {/* Unused codes */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">
                    Disponibles ({unusedCodes.length})
                  </h2>
                  {unusedCodes.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500 text-sm">
                        No hay códigos disponibles. Genera uno nuevo.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {unusedCodes.map((c) => (
                        <Card key={c.id}>
                          <CardContent className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-mono font-bold text-gray-900">
                                {c.code}
                              </p>
                              <p className="text-xs text-gray-400">
                                Creado{" "}
                                {new Date(c.created_at).toLocaleDateString("es-CO")}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Disponible
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Used codes */}
                {usedCodes.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">
                      Utilizados ({usedCodes.length})
                    </h2>
                    <div className="space-y-2">
                      {usedCodes.map((c) => {
                        const raffle = c.used_by_raffle_id
                          ? raffleMap.get(c.used_by_raffle_id)
                          : null;
                        return (
                          <Card key={c.id}>
                            <CardContent className="py-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-mono font-bold text-gray-900">
                                  {c.code}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {raffle ? (
                                    <>
                                      Usado por:{" "}
                                      <Link
                                        href={`/admin/rifa/${raffle.id}`}
                                        className="text-indigo-600 hover:underline"
                                      >
                                        {raffle.title}
                                      </Link>
                                    </>
                                  ) : (
                                    "Rifa eliminada"
                                  )}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shrink-0">
                                Usado
                              </span>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Raffles */}
            {tab === "raffles" && (
              <div className="space-y-3">
                {raffles.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      Aún no se han creado rifas.
                    </CardContent>
                  </Card>
                ) : (
                  raffles.map((raffle) => (
                    <Card
                      key={raffle.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="font-semibold text-gray-900 truncate">
                                {raffle.title}
                              </h2>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  raffle.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : raffle.status === "finished"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {raffle.status === "active"
                                  ? "Activa"
                                  : raffle.status === "finished"
                                  ? "Finalizada"
                                  : "Cancelada"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span>
                                Fecha:{" "}
                                {formatDateLong(raffle.raffle_date)}
                              </span>
                              <span>
                                Números: {raffle.number_from} - {raffle.number_to}
                              </span>
                              <span>
                                Precio: $
                                {raffle.ticket_price.toLocaleString("es-CO")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowRaffleData(
                                  showRaffleData === raffle.id
                                    ? null
                                    : raffle.id
                                )
                              }
                            >
                              {showRaffleData === raffle.id
                                ? "Cerrar"
                                : "Datos"}
                            </Button>
                            <Link
                              href={`/r/${raffle.slug}`}
                              target="_blank"
                            >
                              <Button variant="ghost" size="sm">
                                Ver publica
                              </Button>
                            </Link>
                            <Link href={`/manage/${raffle.id}`}>
                              <Button variant="orange" size="sm">
                                Gestionar
                              </Button>
                            </Link>
                            <Link href={`/admin/rifa/${raffle.id}`}>
                              <Button variant="secondary" size="sm">
                                Admin
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Raffle access data - expandable */}
                        {showRaffleData === raffle.id && (
                          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                ID de la rifa
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-mono font-bold text-gray-900 break-all">
                                  {raffle.id}
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(raffle.id);
                                    toast("success", "ID copiado");
                                  }}
                                  className="shrink-0 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                                  title="Copiar"
                                >
                                  <svg
                                    className="w-3.5 h-3.5 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                                Codigo de administracion
                              </p>
                              {raffleAdminCodes[raffle.id] ? (
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xl font-mono font-extrabold text-amber-900">
                                    {raffleAdminCodes[raffle.id]}
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        raffleAdminCodes[raffle.id]
                                      );
                                      toast("success", "Codigo copiado");
                                    }}
                                    className="shrink-0 p-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 transition-colors"
                                    title="Copiar"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 text-amber-700"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleRegenerateCode(raffle.id)
                                  }
                                  loading={regeneratingCode === raffle.id}
                                >
                                  Generar codigo
                                </Button>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                El codigo no se almacena en texto plano. Si el
                                dueno lo perdio, genera uno nuevo.
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
