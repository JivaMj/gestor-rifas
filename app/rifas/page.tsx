import type { Metadata } from "next";
import Link from "next/link";
import { getActiveRaffles } from "@/actions/public";
import { formatDateShort } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Rifas activas",
  description: "Consultas las rifas activas disponibles para participar.",
};

export default async function RifasPage() {
  const raffles = await getActiveRaffles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Rifas activas
          </h1>
          <p className="text-gray-500 mt-1">
            Selecciona una rifa para participar
          </p>
        </div>

        {raffles.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              No hay rifas activas
            </h2>
            <p className="text-sm text-gray-500">
              Vuelve pronto para ver nuevas oportunidades.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {raffles.map((raffle) => (
              <Link
                key={raffle.id}
                href={`/r/${raffle.slug}`}
                className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all duration-300"
              >
                {raffle.prize_image_url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={raffle.prize_image_url}
                      alt={raffle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white/30"
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
                )}

                <div className="p-5">
                  <h2 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors truncate">
                    {raffle.title}
                  </h2>

                  {raffle.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {raffle.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                        {formatDateShort(raffle.raffle_date)}
                      </span>
                    </div>

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200">
                      ${raffle.ticket_price.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
