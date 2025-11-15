'use client';

// No need to import styles from AdminDashboard.module.css anymore

interface StatBarProps {
  percentage: number;
}

export default function StatBar({ percentage }: StatBarProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  let bgClass = 'bg-success'; // Bootstrap default green
  if (safePercentage > 70) {
    bgClass = 'bg-warning'; // Bootstrap yellow for warning
  }
  if (safePercentage > 90) {
    bgClass = 'bg-danger'; // Bootstrap red for danger
  }

  return (
    <div className="progress" style={{ height: '8px', marginTop: '5px' }}>
      <div
        className={`progress-bar ${bgClass}`}
        role="progressbar"
        style={{ width: `${safePercentage}%` }}
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  );
}
