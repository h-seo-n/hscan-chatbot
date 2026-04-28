import { useState } from "react";
import DeliverInfoCard from "./DeliverInfoCard";
import MedicalConsentForm from "./MedicalConsentForm";
import styles from "./CDPurchaseCard.module.css";

export default function CDPurchaseCard() {
  const [isMedicalConsentChecked, setIsMedicalConsentChecked] = useState(false);

  return (
    <div className={styles.purchaseCard}>
      <DeliverInfoCard />
      <MedicalConsentForm
        checked={isMedicalConsentChecked}
        onCheckedChange={setIsMedicalConsentChecked}
      />
      <button
        className={styles.paymentButton}
        disabled={!isMedicalConsentChecked}
        type="button"
      >
        결제하기
      </button>
    </div>
  );
}
