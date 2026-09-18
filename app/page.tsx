import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-sm text-white/90 font-medium">
              Nuevo metodo de rifas en Cienaga
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            Crea tu rifa
            <br />
            <span className="text-amber-100">en minutos</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Solicita tu codigo, crea tu rifa y compartela por WhatsApp.
            Sin registros complicados, sin pasarelas de pago.
            Simple, rapido y seguro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-amber-700 px-8 py-4 rounded-2xl font-extrabold text-base hover:bg-amber-50 transition-all active:scale-[0.98] shadow-2xl shadow-black/15"
            >
              <svg
                className="w-5 h-5"
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
              Crear mi rifa
            </Link>
            <Link
              href="/rifas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-8 py-4 rounded-2xl font-extrabold text-base hover:bg-white/25 transition-all active:scale-[0.98]"
            >
              Ver rifas activas
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              Como funciona
            </h2>
            <p className="text-gray-500 text-lg">
              Tres pasos sencillos para tu rifa
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Solicita tu codigo",
                description:
                  "Contacta al administrador y solicita un codigo de creacion. Es rapido y sin compromiso.",
                color: "from-amber-400 to-orange-500",
                shadow: "shadow-amber-200",
              },
              {
                step: "2",
                title: "Crea tu rifa",
                description:
                  "Ingresa el codigo, sube la foto del premio, define precios y fechas. Listo en minutos.",
                color: "from-orange-400 to-red-500",
                shadow: "shadow-orange-200",
              },
              {
                step: "3",
                title: "Comparte y vende",
                description:
                  "Comparte el enlace por WhatsApp. Los participantes eligen su numero y confirman por chat.",
                color: "from-red-400 to-pink-500",
                shadow: "shadow-red-200",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-5 shadow-lg ${item.shadow}`}
                >
                  {item.step === "1" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                      />
                    </svg>
                  ) : item.step === "2" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                      />
                    </svg>
                  )}
                </div>
                <div
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${item.color} text-white text-xs font-bold mb-3 shadow-md`}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              Por que usar nuestro gestor
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Sin registros",
                description:
                  "No necesitas crear cuenta. Solicita tu codigo y listo.",
                emoji: "🔑",
              },
              {
                title: "Mobile-first",
                description:
                  "Disenado para compartir por WhatsApp y usar en celular.",
                emoji: "📱",
              },
              {
                title: "Pago por WhatsApp",
                description:
                  "Sin pasarelas complicadas. Coordina el pago directo por chat.",
                emoji: "💬",
              },
              {
                title: "Ganador aleatorio",
                description:
                  "Seleccion automatica del ganador entre los boletos vendidos.",
                emoji: "🎲",
              },
              {
                title: "Panel simple",
                description:
                  "Administra tus rifas, reserva numeros y marca vendidos.",
                emoji: "⚙️",
              },
              {
                title: "Aporte opcional",
                description:
                  "Puedes hacer un aporte voluntario para ayudar a mantener la plataforma.",
                emoji: "☕",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-amber-100 transition-all duration-300 group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {item.emoji}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
            Empieza ahora
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            Solicita tu codigo y crea tu primera rifa en minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-extrabold text-base hover:from-amber-600 hover:to-orange-600 transition-all active:scale-[0.98] shadow-xl shadow-amber-200"
            >
              Crear una rifa
            </Link>
            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-2xl font-extrabold text-base hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Solicitar codigo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-400">
            Gestor de Rifas - Cienaga, Magdalena
          </p>
        </div>
      </footer>
    </div>
  );
}
