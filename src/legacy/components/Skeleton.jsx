function HomeSkeleton() {
  return (
    <div className="skeleton">
      <section className="hero">
        <div className="in hero-grid">
          <div className="hero-copy">
            <div className="sk-line sk-eyebrow" />
            <div className="sk-line sk-title" />
            <div className="sk-line sk-title short" />
            <div className="sk-line sk-text" />
          </div>
          <div className="sk-photo" />
        </div>
        <div className="in stats">
          <div className="stat">
            <div className="sk-line sk-num" />
            <div className="sk-line sk-label" />
          </div>
          <div className="stat">
            <div className="sk-line sk-num" />
            <div className="sk-line sk-label" />
          </div>
          <div className="stat">
            <div className="sk-line sk-num" />
            <div className="sk-line sk-label" />
          </div>
        </div>
      </section>

      <section className="band-ask">
        <div className="in ask-grid">
          <div className="ask-col">
            <div className="sk-line sk-eyebrow" />
            <div className="sk-line sk-question" />
            <div className="sk-line sk-pill" />
          </div>
          <div className="ask-col">
            <div className="sk-line sk-eyebrow" />
            <div className="sk-line sk-question short" />
            <div className="sk-line sk-input" />
          </div>
        </div>
      </section>

      <section className="band-status">
        <div className="in">
          <div className="sk-line sk-question" />
          <div className="sk-block" />
          <div className="sk-figures-row">
            <div className="sk-line sk-num" />
            <div className="sk-line sk-num" />
            <div className="sk-line sk-num" />
          </div>
        </div>
      </section>
    </div>
  );
}

function DiarySkeleton() {
  return (
    <div className="skeleton page">
      <div className="in">
        <div className="page-head">
          <div className="sk-line sk-eyebrow" />
          <div className="sk-line sk-page-title" />
          <div className="sk-line sk-text short" />
        </div>
        <div className="sk-entries">
          {[0, 1, 2].map((i) => (
            <div className="sk-entry" key={i}>
              <div className="sk-line sk-eyebrow" />
              <div className="sk-line sk-entry-title" />
              <div className="sk-line sk-text" />
              <div className="sk-line sk-text short" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="skeleton page">
      <div className="in">
        <div className="page-head">
          <div className="sk-line sk-eyebrow" />
          <div className="sk-line sk-page-title" />
          <div className="sk-line sk-text short" />
        </div>
        <div className="album-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div className="sk-album" key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DatesSkeleton() {
  return (
    <div className="skeleton page">
      <div className="in">
        <div className="page-head">
          <div className="sk-line sk-eyebrow" />
          <div className="sk-line sk-page-title" />
          <div className="sk-line sk-text short" />
        </div>
        <div className="dates-grid">
          <div className="sk-list">
            {[0, 1, 2, 3].map((i) => (
              <div className="sk-ann" key={i} />
            ))}
          </div>
          <div className="sk-cal" />
        </div>
      </div>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="skeleton page">
      <div className="in">
        <div className="page-head">
          <div className="sk-line sk-eyebrow" />
          <div className="sk-line sk-page-title" />
          <div className="sk-line sk-text short" />
        </div>
      </div>
      <section className="band-status">
        <div className="in status-grid">
          <div className="status-main">
            <div className="sk-line sk-question" />
            <div className="sk-block sk-banner-block" />
            <div className="sk-member-skel">
              <div className="sk-circle" />
              <div className="sk-cells-row" />
              <div className="sk-line sk-num" />
            </div>
            <div className="sk-figures-row">
              <div className="sk-line sk-num" />
              <div className="sk-line sk-num" />
              <div className="sk-line sk-num" />
            </div>
          </div>
          <div className="sk-cal sk-cal-dark" />
        </div>
      </section>
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
