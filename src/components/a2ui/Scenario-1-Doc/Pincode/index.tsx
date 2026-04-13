import { useEffect, useState } from "react";
import styles from "./Pincode.module.css";

interface PincodeProps {
  code: string;
  onRefreshCode?: () => void;
}

const DIGIT_COUNT = 6;
const INITIAL_TIME = 10 * 60; // 10분 = 600초

const toDigits = (code: string) => {
  const normalized = code.replace(/\D/g, "").slice(0, DIGIT_COUNT);
  return normalized.padEnd(DIGIT_COUNT, "0").split("");
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function Pincode({ code, onRefreshCode }: PincodeProps) {
  const [remainingTime, setRemainingTime] = useState(INITIAL_TIME);

  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const digits = toDigits(code);
  const isExpired = remainingTime <= 0;

  const handleRefreshCode = () => {
    setRemainingTime(INITIAL_TIME);
    onRefreshCode?.();
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>PIN코드 6자리를 의사에게 알려주세요</h2>

      <div className={styles.noticePanel}>
        <p className={styles.description}>
          의료 영상을 확인할 의사에게 하단 URL 주소에 들어가서 PIN코드를 입력하도록 안내해 주세요.
        </p>
        <p className={styles.url}>doctor.hscan.healthhub.dev</p>
      </div>

      <div
        aria-label={`PIN 코드 ${digits.join(" ")}`}
        className={styles.codeWrapper}
        role="group"
      >
        {digits.map((digit, index) => (
          <div className={styles.digitBox} key={`${digit}-${index}`}>
            <span className={styles.digit}>{digit}</span>
          </div>
        ))}
      </div>

      <p className={styles.expiryNotice}>생성된 코드는 10분 후 자동만료됩니다.</p>

      {isExpired ? (
        <button
          className={`${styles.timerBadge} ${styles.timerBadgeButton}`}
          onClick={handleRefreshCode}
          type="button"
        >
          다시 코드 발급받기
        </button>
      ) : (
        <div aria-live="polite" className={styles.timerBadge}>
          {formatTime(remainingTime)} 남음
        </div>
      )}
    </section>
  );
}
