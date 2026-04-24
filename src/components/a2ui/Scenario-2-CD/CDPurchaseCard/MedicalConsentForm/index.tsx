import checkIcon from "../../../../../assets/check.svg";
import styles from "./MedicalConsentForm.module.css";

interface MedicalConsentFormProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const DESCRIPTION =
  "의료영상은 제증명 자료에 해당하며, 결제 후 기술적 오류로 인한 발급 실패 이외의 경우에는 환불이 어려울 수 있습니다.";

const CONFIRMATION_LABEL = "위 내용을 모두 확인했습니다";

export default function MedicalConsentForm({
  checked,
  onCheckedChange,
}: MedicalConsentFormProps) {
  const handleToggle = () => {
    onCheckedChange(!checked);
  };

  return (
    <section className={styles.card} aria-label="의료영상 발급 동의">
      <div className={styles.content}>
        <p className={styles.description}>{DESCRIPTION}</p>

        <button
          aria-pressed={checked}
          className={`${styles.confirmButton} ${checked ? styles.confirmButtonChecked : ""}`}
          onClick={handleToggle}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}
          >
            <img alt="" className={styles.checkIcon} src={checkIcon} />
          </span>
          <span className={styles.confirmationLabel}>{CONFIRMATION_LABEL}</span>
        </button>
      </div>
    </section>
  );
}
