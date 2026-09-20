"use client";

import { useState, useRef } from "react";
import { createPromotion } from "@/actions/promotions";
import { validateImageFile } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function CreatePromoPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<{
    promo: { slug: string; id: string };
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("");
  const [address, setAddress] = useState("");
  const [conditions, setConditions] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

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

    setLoading(true);

    const result = await createPromotion(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        availability: availability.trim() || undefined,
        address: address.trim() || undefined,
        conditions: conditions.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        facebook: facebook.trim() || undefined,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        website: website.trim() || undefined,
      },
      selectedFile || undefined
    );

    setLoading(false);

    if (result.success && result.promotion) {
      setSuccess({
        promo: { slug: result.promotion.slug, id: result.promotion.id },
      });
      if (result.warning) {
        toast("error", result.warning);
      }
    } else {
      setError(result.error || "No fue posible crear la promocion");
    }
  }

  if (success) {
    const publicUrl = `${window.location.origin}/promo/${success.promo.slug}`;
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Promocion creada correctamente</h1>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs text-purple-700 font-bold mb-1 uppercase tracking-wide">URL publica</p>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-purple-900 font-mono text-sm break-all hover:underline">
                {publicUrl}
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="orange" className="w-full">Ver promocion</Button>
            </a>
            <a href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full">Ir al dashboard</Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Crear promocion</h1>
          <p className="text-gray-500">Publica tu promocion para que todos la vean</p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre de la promocion</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: 2x1 en bebidas" autoFocus />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Descripcion (opcional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalla tu promocion..." rows={3} />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Foto (opcional)</label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                {selectedFile ? selectedFile.name : "Seleccionar imagen"}
              </Button>
              {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP o GIF. Maximo 5MB.</p>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Disponibilidad (opcional)</label>
              <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Ej: Lunes a viernes, 9am - 5pm" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Direccion (opcional)</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Cra 5 #10-20, Cienaga" />
            </div>

            {/* Conditions */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Condiciones (opcional)</label>
              <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ej: No aplica con otros descuentos, sujeto a disponibilidad..." rows={3} />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp (opcional)</label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5730012345678" />
              <p className="text-xs text-gray-400 mt-1">Con codigo de pais. Ej: 5730012345678</p>
            </div>

            {/* Social */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Redes sociales (opcional)</label>
              <div className="space-y-3">
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="URL de Facebook" />
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="URL de Instagram" />
                <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="URL de TikTok" />
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Sitio web" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} variant="orange" size="lg" className="w-full">
              Crear promocion
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
