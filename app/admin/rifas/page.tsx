"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  logoutUser,
  getAllUsers,
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
} from "@/actions/auth";
import { getRaffles } from "@/actions/raffles";
import { getAllFiados } from "@/actions/fiados";
import { getAllPromotions } from "@/actions/promotions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDateLong } from "@/lib/dates";
import type { Raffle, Fiado, Promotion, User } from "@/types";

type Tab = "raffles" | "fiados" | "promos" | "users";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminRifasPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("raffles");
  const [showRaffleData, setShowRaffleData] = useState<string | null>(null);
  const [showFiadoData, setShowFiadoData] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<Record<string, string>>({});
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    name: "",
    business_type: "",
    location: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [r, f, p, u] = await Promise.all([
        getRaffles(),
        getAllFiados(),
        getAllPromotions(),
        getAllUsers(),
      ]);
      setRaffles(r);
      setFiados(f);
      setPromos(p);
      setUsers(u);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push("/admin");
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreatingUser(true);
    const result = await adminCreateUser(
      createUserForm.email,
      createUserForm.password,
      createUserForm.name,
      createUserForm.business_type,
      createUserForm.location
    );
    setCreatingUser(false);

    if (result.success) {
      toast("success", "Usuario creado correctamente");
      setShowCreateUser(false);
      setCreateUserForm({
        email: "",
        password: "",
        name: "",
        business_type: "",
        location: "",
      });
      const updated = await getAllUsers();
      setUsers(updated);
    } else {
      toast("error", result.error || "Error al crear usuario");
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (
      !confirm(
        `Eliminar al usuario "${userName}"? Esta accion no se puede deshacer.`
      )
    ) {
      return;
    }
    setDeletingUser(userId);
    const result = await adminDeleteUser(userId);
    setDeletingUser(null);

    if (result.success) {
      toast("success", "Usuario eliminado");
      const updated = await getAllUsers();
      setUsers(updated);
    } else {
      toast("error", result.error || "Error al eliminar usuario");
    }
  }

  async function handleResetPassword(userId: string) {
    const pass = newPassword[userId];
    if (!pass || pass.length < 6) {
      toast("error", "La contrasena debe tener al menos 6 caracteres");
      return;
    }
    setResettingUser(userId);
    const result = await adminResetPassword(userId, pass);
    setResettingUser(null);

    if (result.success) {
      toast("success", "Contrasena restablecida");
      setNewPassword((prev) => ({ ...prev, [userId]: "" }));
    } else {
      toast("error", result.error || "Error al restablecer contrasena");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
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
                {raffles.length} rifa{raffles.length !== 1 ? "s" : ""} ·{" "}
                {fiados.length} actividad{fiados.length !== 1 ? "es" : ""} ·{" "}
                {promos.length} promocion{promos.length !== 1 ? "es" : ""} ·{" "}
                {users.length} usuario{users.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { key: "raffles" as Tab, label: "Rifas", count: raffles.length },
            {
              key: "fiados" as Tab,
              label: "Actividades",
              count: fiados.length,
            },
            {
              key: "promos" as Tab,
              label: "Promociones",
              count: promos.length,
            },
            { key: "users" as Tab, label: "Usuarios", count: users.length },
          ].map((t) => (
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
              {t.count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.key
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <>
            {/* Tab: Raffles */}
            {tab === "raffles" && (
              <div className="space-y-3">
                {raffles.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      Aun no se han creado rifas.
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
                                Fecha: {formatDateLong(raffle.raffle_date)}
                              </span>
                              <span>
                                Numeros: {raffle.number_from} -{" "}
                                {raffle.number_to}
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
                                  showRaffleData === raffle.id ? null : raffle.id
                                )
                              }
                            >
                              {showRaffleData === raffle.id
                                ? "Cerrar"
                                : "Datos"}
                            </Button>
                            <Link href={`/r/${raffle.slug}`} target="_blank">
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Tab: Fiados */}
            {tab === "fiados" && (
              <div className="space-y-3">
                {fiados.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      Aun no hay actividades fiadas.
                    </CardContent>
                  </Card>
                ) : (
                  fiados.map((fiado) => (
                    <Card
                      key={fiado.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="font-semibold text-gray-900 truncate">
                                {fiado.title}
                              </h2>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  fiado.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {fiado.status === "active"
                                  ? "Activa"
                                  : "Inactiva"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span className="font-bold text-green-600">
                                {formatCurrency(fiado.price)}
                              </span>
                              <span>
                                {fiado.payment_type === "immediate"
                                  ? "Pago inmediato"
                                  : `Hasta el ${formatDateLong(fiado.payment_date || "")}`}
                              </span>
                              {fiado.discount_info && (
                                <span className="text-green-600">
                                  {fiado.discount_info}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowFiadoData(
                                  showFiadoData === fiado.id ? null : fiado.id
                                )
                              }
                            >
                              {showFiadoData === fiado.id
                                ? "Cerrar"
                                : "Datos"}
                            </Button>
                            <Link href={`/f/${fiado.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                Ver publica
                              </Button>
                            </Link>
                            <Link href={`/fiado/${fiado.id}`}>
                              <Button variant="orange" size="sm">
                                Administrar
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {showFiadoData === fiado.id && (
                          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                ID de la actividad
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-mono font-bold text-gray-900 break-all">
                                  {fiado.id}
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(fiado.id);
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Tab: Promos */}
            {tab === "promos" && (
              <div className="space-y-3">
                {promos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      Aun no hay promociones.
                    </CardContent>
                  </Card>
                ) : (
                  promos.map((promo) => (
                    <Card
                      key={promo.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="font-semibold text-gray-900 truncate">
                                {promo.title}
                              </h2>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  promo.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {promo.status === "active"
                                  ? "Activa"
                                  : "Inactiva"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              {promo.availability && (
                                <span>{promo.availability}</span>
                              )}
                              {promo.address && <span>{promo.address}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowFiadoData(
                                  showFiadoData === promo.id ? null : promo.id
                                )
                              }
                            >
                              {showFiadoData === promo.id
                                ? "Cerrar"
                                : "Datos"}
                            </Button>
                            <a
                              href={`/promo/${promo.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm">
                                Ver publica
                              </Button>
                            </a>
                            <a href={`/promo-manage/${promo.id}`}>
                              <Button variant="orange" size="sm">
                                Administrar
                              </Button>
                            </a>
                          </div>
                        </div>

                        {showFiadoData === promo.id && (
                          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                ID de la promocion
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-mono font-bold text-gray-900 break-all">
                                  {promo.id}
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(promo.id);
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Tab: Users */}
            {tab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Usuarios ({users.length})
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateUser(!showCreateUser)}
                  >
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
                    Crear usuario
                  </Button>
                </div>

                {showCreateUser && (
                  <Card>
                    <CardContent className="py-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Nuevo usuario
                      </h3>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Nombre"
                            placeholder="Nombre completo"
                            value={createUserForm.name}
                            onChange={(e) =>
                              setCreateUserForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                          <Input
                            label="Correo"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={createUserForm.email}
                            onChange={(e) =>
                              setCreateUserForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                          />
                          <Input
                            label="Contrasena"
                            type="password"
                            placeholder="Minimo 6 caracteres"
                            value={createUserForm.password}
                            onChange={(e) =>
                              setCreateUserForm((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            required
                          />
                          <Input
                            label="Tipo de negocio"
                            placeholder="Opcional"
                            value={createUserForm.business_type}
                            onChange={(e) =>
                              setCreateUserForm((prev) => ({
                                ...prev,
                                business_type: e.target.value,
                              }))
                            }
                          />
                          <Input
                            label="Ubicacion"
                            placeholder="Opcional"
                            value={createUserForm.location}
                            onChange={(e) =>
                              setCreateUserForm((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setShowCreateUser(false)}
                          >
                            Cancelar
                          </Button>
                          <Button size="sm" type="submit" loading={creatingUser}>
                            Crear usuario
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {users.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      No hay usuarios registrados.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {user.name}
                                </h3>
                                {user.is_admin && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                <span>{user.email}</span>
                                {user.location && <span>{user.location}</span>}
                                <span>
                                  {new Date(
                                    user.created_at
                                  ).toLocaleDateString("es-CO")}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <Input
                                  placeholder="Nueva contrasena"
                                  type="password"
                                  className="w-40"
                                  value={newPassword[user.id] || ""}
                                  onChange={(e) =>
                                    setNewPassword((prev) => ({
                                      ...prev,
                                      [user.id]: e.target.value,
                                    }))
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetPassword(user.id)}
                                  loading={resettingUser === user.id}
                                >
                                  Restablecer contrasena
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteUser(user.id, user.name)
                                }
                                loading={deletingUser === user.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
