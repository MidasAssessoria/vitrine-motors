export function SkeletonCar({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-border overflow-hidden">
          {/* Image skeleton — car silhouette */}
          <div className="aspect-[4/3] skeleton relative">
            <svg
              viewBox="0 0 400 300"
              className="absolute inset-0 w-full h-full opacity-[0.04]"
              fill="currentColor"
            >
              <path d="M60 220 Q60 200 80 200 L120 200 L140 160 Q145 150 155 150 L245 150 Q255 150 260 160 L280 200 L320 200 Q340 200 340 220 L340 240 Q340 260 320 260 L80 260 Q60 260 60 240 Z" />
              <circle cx="120" cy="260" r="20" />
              <circle cx="280" cy="260" r="20" />
            </svg>
          </div>
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-5 w-1/2 rounded" />
            <div className="flex gap-3">
              <div className="skeleton h-3 w-12 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-3 w-10 rounded" />
            </div>
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="border-t border-border pt-3 flex justify-between">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
