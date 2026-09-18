"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getRaffleById,
  verifyRaffleCode,
  updateRaffle,
  getRaffleStats,
} from "@/actions/raffles";
import { validateImageFile, formatFileSize } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDateLong } from "@/lib/dates";
import type { Raffle, RaffleStats } from "@/types";

export default function AdminRifaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const raffleId = params.id as string;

  const [codeVerified, setCodeVerified] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    title?: string;
    description?: string;
    ticket_price?: number;
    whatsapp?: string;
    terms?: string;
  }>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileError, setEditFileError] = useState("");

  useEffect(() => {
    if (!codeVerified) return;
    async function load() {
      setLoading(true);
      const result = await getRaffleById(raffleId);
      if (result.raffle) {
        setRaffle(result.raffle);
        const s = await getRaffleStats(
          raffleId,
          result.raffle.number_from,
          result.raffle.number_to,
          result.raffle.ticket_price
        );
        setStats(s);
      }
      setLoading(false);
    }
    load();
  }, [codeVerified, raffleId, refreshKey]);

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

  async function handleUpdateRaffle(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditFileError("");

    const result = await updateRaffle(raffleId, editForm, editFile || undefined);
    setEditLoading(false);

    if (result.success) {
      if (result.warning) {
        toast("warning", result.warning);
      } else {
        toast("success", "Cambios guardados");
      }
      setEditMode(false);
      setEditFile(null);
      setRefreshKey((k) => k + 1);
    } else {
      setEditError(result.error || "Error al guardar");
      toast("error", result.error || "Error al guardar");
    }
  }

  if (!codeVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
        <Card className="w-full max-w-sm shadow-xl border-0">
          <CardContent className="py-8 px-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 mb-4 shadow-lg shadow-indigo-200">
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
                Acceso administrativo
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa el codigo de administracion de esta rifa
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
              >
                Acceder
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/admin/rifas")}
              >
                Volver
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
            <span className="text-gray-300">/</span>
            <Link
              href="/admin/rifas"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Admin
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">
                {raffle.title}
              </h1>
              <p className="text-sm text-gray-500">
                Vista administrativa
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
              <Link href={`/manage/${raffle.id}`}>
                <Button variant="orange" size="sm">
                  Gestionar
                </Button>
              </Link>
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

        {/* Info card */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900">
                Informacion de la rifa
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditMode(!editMode);
                  setEditForm({
                    title: raffle.title,
                    description: raffle.description || "",
                    ticket_price: raffle.ticket_price,
                    whatsapp: raffle.whatsapp,
                    terms: raffle.terms || "",
                  });
                }}
              >
                {editMode ? "Cancelar" : "Editar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <form onSubmit={handleUpdateRaffle} className="space-y-4">
                <Input
                  label="Premio"
                  value={editForm.title || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
                <Textarea
                  label="Descripcion"
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Precio del boleto"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={editForm.ticket_price || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ticket_price: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label="WhatsApp"
                    value={editForm.whatsapp || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, whatsapp: e.target.value })
                    }
                  />
                </div>
                <Textarea
                  label="Terminos y condiciones"
                  value={editForm.terms || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, terms: e.target.value })
                  }
                  rows={3}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cambiar imagen (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setEditFileError("");
                      setEditFile(null);
                      if (!file) return;
                      const validation = validateImageFile(file);
                      if (!validation.valid) {
                        setEditFileError(
                          validation.error || "Archivo invalido"
                        );
                        e.target.value = "";
                        return;
                      }
                      setEditFile(file);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WebP o GIF. Maximo 5MB.
                  </p>
                  {editFileError && (
                    <p className="text-sm text-red-600 mt-1">
                      {editFileError}
                    </p>
                  )}
                  {editFile && !editFileError && (
                    <p className="text-xs text-green-600 mt-1">
                      {editFile.name} ({formatFileSize(editFile.size)})
                    </p>
                  )}
                </div>
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {editError}
                  </div>
                )}
                <Button type="submit" loading={editLoading}>
                  Guardar cambios
                </Button>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <Row label="Premio" value={raffle.title} />
                <Row label="Descripcion" value={raffle.description || "-"} />
                <Row
                  label="Fecha"
                  value={formatDateLong(raffle.raffle_date)}
                />
                <Row
                  label="Rango"
                  value={`${raffle.number_from} - ${raffle.number_to}`}
                />
                <Row
                  label="Precio"
                  value={`$${raffle.ticket_price.toLocaleString("es-CO")}`}
                />
                <Row label="WhatsApp" value={raffle.whatsapp} />
                <Row
                  label="Metodo ganador"
                  value={
                    raffle.winner_method === "random" ? "Aleatorio" : "Manual"
                  }
                />
                <Row label="Estado" value={raffle.status} />
                {raffle.winner_number !== null && (
                  <Row
                    label="Ganador"
                    value={`Numero ${raffle.winner_number}${
                      raffle.winner_source
                        ? ` (${raffle.winner_source})`
                        : ""
                    }`}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
