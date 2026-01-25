import DestinationCard from "./DestinationCard.jsx";
import { Globe, MapPin, Plane, Sparkles, Star } from "lucide-react";

function OrganizedTrips({ destinations = [] }) {
  return (
    <section className="relative w-full bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Top Border - Decorative Wave */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
            <Plane className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
              Voyages Organisés
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Découvrez Nos
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
              Destinations Exclusives
            </span>
          </h2>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <Globe className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">
                  {destinations.length}
                </div>
                <div className="text-sm text-slate-400">Destinations</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-slate-400">Satisfaction</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <Star className="w-6 h-6 text-orange-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm text-slate-400">Note Moyenne</div>
              </div>
            </div>
          </div>
        </div>

        {/* Destinations Grid */}
        {destinations.length > 0 ? (
          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 xl:gap-12">
              {destinations.map((destination, index) => (
                <div
                  key={destination.id}
                  className="animate-fade-in-up w-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <DestinationCard {...destination} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6">
              <MapPin className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Aucune destination disponible
            </h3>
            <p className="text-slate-400">
              Nos prochaines destinations seront bientôt disponibles. Restez à
              l'écoute !
            </p>
          </div>
        )}
      </div>

      {/* Bottom Border - Decorative Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0"></div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
}

export default OrganizedTrips;
