/** Hero section with pool table image - use as page header */
export function HeroPool({
  title,
  subtitle,
  imageUrl = 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1200&q=80',
  compact = false,
}: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${compact ? 'h-32 sm:h-40' : 'h-44 sm:h-56'} mb-6 sm:mb-8`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/80 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--color-cream)] tracking-wide drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[var(--color-cream-dim)] text-sm sm:text-base max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
