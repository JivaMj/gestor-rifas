"use client";

import { useState, useRef } from "react";
import { createFiado } from "@/actions/fiados";
import { validateImageFile } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function CreateFiadoPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<{
    fiado: { slug: string; id: string };
    adminCode: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [paymentType, setPaymentType] = useState("immediate");
  const [paymentDate, setPaymentDate] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [discountInfo, setDiscountInfo] = useState("");

  const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "5730012345678";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error!);
      return;
    }

    setFileError("");
    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!whatsapp.trim()) {
      setError("El numero de WhatsApp es requerido");
      return;
    }
    if (paymentType === "scheduled" && !paymentDate) {
      setError("La fecha de pago es requerida");
      return;
    }

    setLoading(true);

    const result = await createFiado(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        payment_type: paymentType as "immediate" | "scheduled",
        payment_date: paymentType === "scheduled" ? paymentDate : undefined,
        whatsapp: whatsapp.trim(),
        discount_info: discountInfo.trim() || undefined,
      },
      selectedFile || undefined
    );

    setLoading(false);

    if (result.success && result.fiado && result.adminCode) {
      setSuccess({
        fiado: { slug: result.fiado.slug, id: result.fiado.id },
        adminCode: result.adminCode,
      });
      if (result.warning) {
        toast("error", result.warning);
      }
    } else {
      setError(result.error || "No fue posible crear la publicacion");
    }
  }

  if (success) {
    const publicUrl = `${window.location.origin}/f/${success.fiado.slug}`;
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">
              Publicacion creada correctamente
            </h1>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-700 font-bold mb-1 uppercase tracking-wide">
                URL publica
              </p>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-900 font-mono text-sm break-all hover:underline"
              >
                {publicUrl}
              </a>
            </div>

            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-700 font-bold mb-1 uppercase tracking-wide">
                Codigo de administracion
              </p>
              <p className="text-red-900 font-mono text-lg font-bold tracking-wider">
                {success.adminCode}
              </p>
              <p className="text-xs text-red-600 mt-2">
                Guarda este codigo. Es el unico medio para administrar tu
                publicacion. No se puede recuperar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="orange" className="w-full">
                Ver publicacion
              </Button>
            </a>
            <a
              href={`https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hola, acabo de crear mi actividad fiada. URL: ${publicUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="whatsapp" className="w-full">
                Enviar por WhatsApp
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Crear actividad fiada
          </h1>
          <p className="text-gray-500">
            Publica tu producto o servicio para venta a credito
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nombre del producto/servicio
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Arroz con leche, Torta, Corte de cabello..."
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Descripcion (opcional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla el producto, ingredientes, tamanos, etc."
                rows={3}
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Foto (opcional)
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
                {selectedFile ? selectedFile.name : "Seleccionar imagen"}
              </Button>
              {fileError && (
                <p className="text-xs text-red-500 mt-1">{fileError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP o GIF. Maximo 5MB.
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Precio
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                min="0"
                step="100"
              />
              <p className="text-xs text-gray-400 mt-1">
                En pesos colombianos (COP)
              </p>
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

            {/* Payment date */}
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
                placeholder="5730012345678"
              />
              <p className="text-xs text-gray-400 mt-1">
                Con codigo de pais. Ej: 5730012345678
              </p>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Descuento por varias compras (opcional)
              </label>
              <Textarea
                value={discountInfo}
                onChange={(e) => setDiscountInfo(e.target.value)}
                placeholder="Ej: 2x1, 10% al comprar 5 o mas, etc."
                rows={2}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              variant="orange"
              size="lg"
              className="w-full"
            >
              Crear publicacion
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
