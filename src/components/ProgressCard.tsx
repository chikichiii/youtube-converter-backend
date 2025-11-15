import styles from '../app/page.module.css';

interface ProgressCardProps {
  conversionStatus: string;
  conversionProgress: number;
}

export default function ProgressCard({
  conversionStatus,
  conversionProgress,
}: ProgressCardProps) {
  const isCompleted = conversionProgress >= 100;

  return (
    <div className={styles.progressCard}>
      {isCompleted ? (
        <div className={styles.downloadReady}>
          <p>ダウンロードが開始されます</p>
        </div>
      ) : (
        <>
          <div className={styles.progressStatus}>{conversionStatus}</div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${conversionProgress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
