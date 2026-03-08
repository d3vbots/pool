/** Hero section with pool table image – used as page header across the app */
export function HeroPool({
  title,
  subtitle,
  imageUrl,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  compact?: boolean;
}) {
  const defaultImage = '/pool.jpeg';
  const src = imageUrl ?? defaultImage;
  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl overflow-hidden ${compact ? 'h-32 sm:h-44' : 'h-40 sm:h-64'} mb-4 sm:mb-8 shadow-2xl shadow-black/40`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-700 ease-out"
        style={{ backgroundImage: `url(${src})` }}
      />
      {/* Stronger gradient so text is always readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, var(--color-surface) 0%, var(--color-surface) 25%, transparent 55%, transparent 100%)',
        }}
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.35)',
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-[var(--color-cream)] tracking-wide drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 sm:mt-2 text-[var(--color-cream-dim)] text-sm sm:text-base max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {/* Gold accent line under title */}
        <div
          className="mt-3 h-0.5 w-16 rounded-full opacity-80"
          style={{ background: 'linear-gradient(90deg, var(--color-gold), transparent)' }}
        />
      </div>
    </div>
  );
}
