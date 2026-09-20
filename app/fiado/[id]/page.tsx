"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFiadoById, updateFiado } from "@/actions/fiados";
import { getAuthUser } from "@/actions/auth";
import { validateImageFile } from "@/lib/validation";
import { formatDateLong } from "@/lib/dates";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { Fiado } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ManageFiadoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const fiadoId = params.id as string;

  const [fiado, setFiado] = useState<Fiado | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [paymentType, setPaymentType] = useState("immediate");
  const [paymentDate, setPaymentDate] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [discountInfo, setDiscountInfo] = useState("");
  const [status, setStatus] = useState("active");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const user = await getAuthUser();
      if (cancelled) return;
      if (!user) {
        setAuthError("No autenticado. Inicia sesion para continuar.");
        setLoading(false);
        return;
      }
      const data = await getFiadoById(fiadoId);
      if (cancelled) return;
      if (data && data.owner_id !== user.id) {
        setAuthError("No tienes permiso para administrar esta publicacion.");
        setLoading(false);
        return;
      }
      if (data) {
        setFiado(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPrice(String(data.price));
        setPaymentType(data.payment_type);
        setPaymentDate(data.payment_date || "");
        setWhatsapp(data.whatsapp);
        setDiscountInfo(data.discount_info || "");
        setStatus(data.status);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fiadoId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast("error", validation.error!);
      return;
    }
    setSelectedFile(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast("error", "El nombre es requerido");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast("error", "El precio debe ser mayor a 0");
      return;
    }

    setSaving(true);
    const result = await updateFiado(
      fiadoId,
      {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        payment_type: paymentType as "immediate" | "scheduled",
        payment_date: paymentType === "scheduled" ? paymentDate : undefined,
        whatsapp: whatsapp.trim(),
        discount_info: discountInfo.trim() || undefined,
        status: status as "active" | "inactive",
      },
      selectedFile || undefined
    );
    setSaving(false);

    if (result.success) {
      toast("success", "Cambios guardados correctamente");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const data = await getFiadoById(fiadoId);
      if (data) {
        setFiado(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPrice(String(data.price));
        setPaymentType(data.payment_type);
        setPaymentDate(data.payment_date || "");
        setWhatsapp(data.whatsapp);
        setDiscountInfo(data.discount_info || "");
        setStatus(data.status);
      }
      if (result.warning) {
        toast("error", result.warning);
      }
    } else {
      toast("error", result.error || "Error al guardar");
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

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-gray-900 font-bold mb-2">Acceso denegado</p>
          <p className="text-gray-500 text-sm mb-6">{authError}</p>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/dashboard")}>
            Ir al dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!fiado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-gray-500">No autorizado</p>
        </Card>
      </div>
    );
  }

  const publicUrl = `/f/${fiado.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">
              Administrar
            </h1>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              Ver publicacion →
            </a>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              fiado.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {fiado.status === "active" ? "Activa" : "Inactiva"}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nombre del producto/servicio
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Descripcion
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Foto
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {selectedFile
                  ? selectedFile.name
                  : fiado.image_url
                  ? "Cambiar imagen"
                  : "Subir imagen"}
              </Button>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP o GIF. Maximo 5MB.
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Precio (COP)
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="100"
              />
            </div>

            {/* Payment type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Tipo de pago
              </label>
              <Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                options={[
                  { value: "immediate", label: "Pago inmediato" },
                  { value: "scheduled", label: "Pago en fecha especifica" },
                ]}
              />
            </div>

            {paymentType === "scheduled" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Fecha maxima de pago
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            )}

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Numero de WhatsApp
              </label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Descuento por varias compras
              </label>
              <Textarea
                value={discountInfo}
                onChange={(e) => setDiscountInfo(e.target.value)}
                rows={2}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Estado
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "active", label: "Activa" },
                  { value: "inactive", label: "Inactiva" },
                ]}
              />
            </div>

            <Button
              type="submit"
              loading={saving}
              variant="orange"
              size="lg"
              className="w-full"
            >
              Guardar cambios
            </Button>
          </form>
        </Card>

        {/* Stats summary */}
        <Card className="p-6 mt-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Resumen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Precio</p>
              <p className="text-lg font-extrabold text-gray-900">
                {formatCurrency(fiado.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pago</p>
              <p className="text-lg font-extrabold text-gray-900">
                {fiado.payment_type === "immediate"
                  ? "Inmediato"
                  : formatDateLong(fiado.payment_date || "")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
