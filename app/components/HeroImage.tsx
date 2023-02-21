export function HeroImage() {
  return (
    <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
      <div className="relative min-h-[40vh] shadow-xl sm:overflow-hidden sm:rounded-2xl">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="/assets/mulch_wagon.jpg"
            alt="Beautiful mulch and a wagon"
          />
        </div>
      </div>
    </div>
  );
}
