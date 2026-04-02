import styles from "./Pincode.module.css";

interface PincodeProps {
  title?: string;
  description?: string;
  doctorUrl?: string;
  code?: string;
  expiryNotice?: string;
  remainingTimeLabel?: string;
}

const DIGIT_COUNT = 6;

const toDigits = (code: string) => {
  const normalized = code.replace(/\D/g, "").slice(0, DIGIT_COUNT);
  return normalized.padEnd(DIGIT_COUNT, "0").split("");
};

export default function Pincode({
  title = "PIN코드 6자리를 의사에게 알려주세요",
  description =
    "의료 영상을 확인할 의사에게 하단 URL 주소에 들어가서 PIN코드를 입력하도록 안내해 주세요.",
  doctorUrl = "doctor.hscan.healthhub.dev",
  code = "000000",
  expiryNotice = "생성된 코드는 72시간 후 자동만료됩니다.",
  remainingTimeLabel = "00:00:00 남음",
}: PincodeProps) {
  const digits = toDigits(code);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.noticePanel}>
        <p className={styles.description}>{description}</p>
        <p className={styles.url}>{doctorUrl}</p>
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

      <p className={styles.expiryNotice}>{expiryNotice}</p>
      <div aria-live="polite" className={styles.timerBadge}>
        {remainingTimeLabel}
      </div>
    </section>
  );
}
