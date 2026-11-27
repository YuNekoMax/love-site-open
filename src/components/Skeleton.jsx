function HomeSkeleton() {
  return (
    <div className="skeleton sk-stack">
      <div className="sk-card hero" />
      <div className="sk-row-2">
        <div className="sk-card ask" />
        <div className="sk-card status" />
      </div>
      <div className="sk-card recent" />
    </div>
  );
}

function DiarySkeleton() {
  return (
    <div className="skeleton sk-diary">
      <div className="sk-line sk-month" />
      <div className="sk-diary-list">
        {[0, 1, 2].map((i) => (
          <div className="sk-entry" key={i} />
        ))}
      </div>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="skeleton sk-album-wrap">
      <div className="sk-line sk-month" />
      <div className="sk-album-grid">
        <div className="sk-album is-wide" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div className="sk-album" key={i} />
        ))}
      </div>
    </div>
  );
}

function DatesSkeleton() {
  return (
    <div className="skeleton dates-grid">
      <div className="sk-stack">
        <div className="sk-card tall" />
        <div className="sk-card" />
      </div>
      <div className="sk-stack">
        <div className="sk-cal" />
      </div>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="skeleton dates-grid">
      <div className="sk-card tall" />
      <div className="sk-cal" />
    </div>
  );
}

export default function Skeleton({ variant = 'home' }) {
  if (variant === 'diary') return <DiarySkeleton />;
  if (variant === 'album') return <AlbumSkeleton />;
  if (variant === 'dates') return <DatesSkeleton />;
  if (variant === 'status') return <StatusSkeleton />;
  return <HomeSkeleton />;
}
