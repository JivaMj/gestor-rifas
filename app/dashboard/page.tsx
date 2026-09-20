"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser, getAuthUser, changePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string; is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getAuthUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      toast("success", "Contrasena cambiada correctamente");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast("error", result.error || "Error al cambiar contrasena");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Mi panel</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {user.is_admin && (
              <Link href="/admin/rifas">
                <Button variant="secondary" size="sm">Admin</Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>Salir</Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <Card className="p-6">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Hola, {user.name}
          </h2>
          <p className="text-gray-500 text-sm">
            Gestiona tus rifas, actividades fiadas y promociones desde aqui.
          </p>
        </Card>

        {/* Create actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/create" className="block">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="text-2xl mb-2">🎲</div>
              <h3 className="font-bold text-gray-900 mb-1">Crear rifa</h3>
              <p className="text-xs text-gray-500">Sorteo de numeros con premio</p>
            </Card>
          </Link>
          <Link href="/fiado/create" className="block">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="text-2xl mb-2">🏷️</div>
              <h3 className="font-bold text-gray-900 mb-1">Actividad fiada</h3>
              <p className="text-xs text-gray-500">Producto o servicio a credito</p>
            </Card>
          </Link>
          <Link href="/promo/create" className="block">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="font-bold text-gray-900 mb-1">Promocion</h3>
              <p className="text-xs text-gray-500">Oferta con direccion y redes</p>
            </Card>
          </Link>
        </div>

        {/* Password change */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Seguridad</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              {showPasswordForm ? "Cancelar" : "Cambiar contrasena"}
            </Button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Contrasena actual" required />
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contrasena (minimo 6 caracteres)" required />
              <Button type="submit" loading={passwordLoading} size="sm">Guardar</Button>
            </form>
          )}

          {!showPasswordForm && (
            <p className="text-sm text-gray-500">
              Tu contrasena se puede cambiar en cualquier momento.
              Para recuperar tu contrasena contacta al administrador.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
