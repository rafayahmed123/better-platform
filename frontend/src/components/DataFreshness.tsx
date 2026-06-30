import React, { useEffect, useState } from 'react';

interface Props {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function DataFreshness({ lastUpdated, onRefresh, loading }: Props) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const isStale = secondsAgo >= 60;
  const isVeryStale = secondsAgo >= 120;

  const label = !lastUpdated
    ? 'Never loaded'
    : secondsAgo < 5
    ? 'Just updated'
    : secondsAgo < 60
    ? `Updated ${secondsAgo}s ago`
    : `Updated ${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s ago`;

  const color = isVeryStale ? '#f87171' : isStale ? '#fbbf24' : '#34d399';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {lastUpdated && (
        <span style={{ fontSize: 12, color, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: color, display: 'inline-block',
            boxShadow: isVeryStale ? 'none' : `0 0 6px ${color}`
          }} />
          {label}
          {isStale && ' — odds may have moved'}
        </span>
      )}
      <button className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
