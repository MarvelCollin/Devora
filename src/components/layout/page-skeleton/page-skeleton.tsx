export const PageSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 [animation:fade-in_150ms_ease-out_150ms_both] sm:px-6 lg:px-10 lg:py-8"
  >
    <span className="sr-only">Loading tool</span>
    <div className="flex flex-col gap-2">
      <div className="h-8 w-56 animate-pulse rounded-md bg-surface" />
      <div className="h-5 w-full max-w-md animate-pulse rounded-md bg-surface" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-lg bg-surface" />
      <div className="h-72 animate-pulse rounded-lg bg-surface" />
    </div>
  </div>
);
