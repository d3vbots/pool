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
      className={`relative rounded-2xl overflow-hidden ${compact ? 'h-32 sm:h-40' : 'h-44 sm:h-56'} mb-6 sm:mb-8 shadow-xl`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)]  via-[var(--color-surface)]/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--color-cream)] tracking-wide drop-shadow-md">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[var(--color-cream-dim)] text-sm sm:text-base max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
