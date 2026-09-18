"use client";

import { useState } from "react";
import { NumberGrid } from "@/components/number-grid";
import { formatDateShort } from "@/lib/dates";
import type { Raffle } from "@/types";

interface RaffleClientProps {
  raffle: Raffle;
  tickets: { number: number; status: string }[];
}

export function RaffleClient({ raffle, tickets }: RaffleClientProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const ticketMap = new Map(tickets.map((t) => [t.number, t.status]));
  const soldCount = tickets.filter((t) => t.status === "sold").length;
  const reservedCount = tickets.filter((t) => t.status === "reserved").length;
  const totalNumbers = raffle.number_to - raffle.number_from + 1;
  const availableCount = totalNumbers - soldCount - reservedCount;

  function handleSelect(num: number) {
    if (selectedNumber === num) {
      setSelectedNumber(null);
      setShowConfirm(false);
    } else {
      setSelectedNumber(num);
      setShowConfirm(true);
    }
  }

  function handleWhatsApp() {
    if (selectedNumber === null) return;
    const numberWidth = raffle.number_to.toString().length;
    const formattedNumber = selectedNumber.toString().padStart(numberWidth, "0");
    const message = `Hola, quiero participar en la rifa de ${raffle.title}.\n\nNumero seleccionado: ${formattedNumber}\n\nPrecio: $${raffle.ticket_price.toLocaleString("es-CO")}`;
    const url = `https://wa.me/${raffle.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  const numberWidth = raffle.number_to.toString().length;
  const isFinished = raffle.status === "finished";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-lg mx-auto px-4 pt-10 pb-16 text-center text-white">
          {raffle.prize_image_url && (
            <div className="mb-6">
              <button
                onClick={() => setShowLightbox(true)}
                className="block mx-auto cursor-pointer group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-40 h-40 object-cover rounded-2xl mx-auto border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                />
                <p className="text-xs text-white/70 mt-2 flex items-center justify-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  Toca para ampliar
                </p>
              </button>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 drop-shadow-lg">
            {raffle.title}
          </h1>
          {raffle.description && (
            <p className="text-amber-100 text-sm mb-4 max-w-sm mx-auto">
              {raffle.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div>
              <p className="text-amber-200">Precio</p>
              <p className="text-xl font-extrabold">
                ${raffle.ticket_price.toLocaleString("es-CO")}
              </p>
            </div>
            <div className="w-px h-8 bg-amber-300/50" />
            <div>
              <p className="text-amber-200">Fecha</p>
              <p className="text-lg font-extrabold">
                {formatDateShort(raffle.raffle_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        {/* Finished banner */}
        {isFinished ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 text-center">
            {raffle.winner_number !== null ? (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-xl shadow-orange-200">
                  <span className="text-3xl font-extrabold text-white">
                    {raffle.winner_number.toString().padStart(numberWidth, "0")}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                  Numero ganador
                </h2>
                <p className="text-4xl font-extrabold text-amber-600 mb-2">
                  {raffle.winner_number.toString().padStart(numberWidth, "0")}
                </p>
                {raffle.winner_source && (
                  <p className="text-xs text-gray-400 mt-2">
                    {raffle.winner_source}
                  </p>
                )}
                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full">
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
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Rifa finalizada
                </div>
              </>
            ) : (
              <div className="py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                  <svg
                    className="w-8 h-8 text-gray-500"
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
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                  Rifa finalizada
                </h2>
                <p className="text-sm text-gray-500">
                  Ganador pendiente de determinar
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-500">
                  Numeros: {raffle.number_from} - {raffle.number_to}
                </span>
                <span className="text-amber-600 font-semibold">
                  {availableCount} disponibles
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${((soldCount + reservedCount) / totalNumbers) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{soldCount} vendidos</span>
                <span>{reservedCount} reservados</span>
              </div>
            </div>

            {/* Number grid */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-4">
              <h2 className="text-sm font-extrabold text-gray-900 mb-3">
                Selecciona tu numero
              </h2>
              <NumberGrid
                numberFrom={raffle.number_from}
                numberTo={raffle.number_to}
                tickets={ticketMap}
                selectedNumber={selectedNumber}
                onSelect={handleSelect}
                status={raffle.status}
              />
            </div>

            {/* Confirmation */}
            {showConfirm && selectedNumber !== null && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 mb-4 animate-in slide-in-from-bottom-2">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Numero seleccionado</p>
                  <p className="text-4xl font-extrabold text-amber-600 my-2">
                    {selectedNumber.toString().padStart(numberWidth, "0")}
                  </p>
                  <p className="text-sm text-gray-500">
                    Precio:{" "}
                    <span className="font-bold text-gray-900">
                      ${raffle.ticket_price.toLocaleString("es-CO")}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-green-700 transition-colors active:scale-[0.98] shadow-lg shadow-green-200"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Continuar por WhatsApp
                </button>
              </div>
            )}
          </>
        )}

        {/* Terms */}
        {raffle.terms && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 mb-8">
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">
              Terminos y condiciones
            </h3>
            <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">
              {raffle.terms}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-400">
            Rifa organizada por {raffle.whatsapp}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && raffle.prize_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setShowLightbox(false)}
          >
            <svg
              className="w-8 h-8"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={raffle.prize_image_url}
            alt={raffle.title}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
