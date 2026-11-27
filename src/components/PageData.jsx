import { useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import ErrorState from './ErrorState';

export default function PageData({ variant, state, children }) {
  const { loading, data, error } = state;
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
      setFading(false);
      return;
    }
    if (!data) return;
    setFading(true);
    const timer = setTimeout(() => {
      setShowSkeleton(false);
      setFading(false);
    }, 240);
    return () => clearTimeout(timer);
  }, [loading, data]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="page-data-wrap">
      {showSkeleton && (
        <div className={`sk-overlay${fading ? ' is-out' : ''}`} aria-hidden="true">
          <Skeleton variant={variant} />
        </div>
      )}
      {data && <div className="page-content">{children(data, state)}</div>}
    </div>
  );
}
