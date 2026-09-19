export function CourtField({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 420" className={className} aria-hidden="true">
      <rect width="640" height="420" fill="#0B0F19" />
      <rect x="24" y="24" width="592" height="372" fill="none" stroke="#C7FF2F" strokeWidth="3" />
      <line x1="320" y1="24" x2="320" y2="396" stroke="#C7FF2F" strokeWidth="2" />
      <circle cx="320" cy="210" r="56" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <circle cx="320" cy="210" r="6" fill="#C7FF2F" />
      <rect x="24" y="120" width="90" height="180" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <rect x="526" y="120" width="90" height="180" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <rect x="24" y="156" width="44" height="108" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <rect x="572" y="156" width="44" height="108" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <path d="M114 168 A56 56 0 0 1 114 252" fill="none" stroke="#C7FF2F" strokeWidth="2" />
      <path d="M526 168 A56 56 0 0 0 526 252" fill="none" stroke="#C7FF2F" strokeWidth="2" />
    </svg>
  );
}

export function VenuePlaceholder({ name, className }: { name: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-night ${className ?? ""}`}>
      <CourtField className="absolute inset-0 h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-2xl font-extrabold tracking-tight text-white">{name}</div>
    </div>
  );
}
