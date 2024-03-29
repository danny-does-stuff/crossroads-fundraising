export function HeroImage({
  src = "/assets/youth_with_mulch_bags.png",
  alt = "Crossroads Youth Prepared to Spread Mulch",
}: {
  src?: string;
  alt?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
      <div className="relative min-h-[40vh] shadow-xl sm:overflow-hidden sm:rounded-2xl">
        <div className="absolute inset-0">
          <img className="h-full w-full object-cover" src={src} alt={alt} />
        </div>
      </div>
    </div>
  );
}
