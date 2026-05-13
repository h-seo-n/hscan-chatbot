import { useState } from "react";
import DeliverInfoCard from "./DeliverInfoCard";
import MedicalConsentForm from "./MedicalConsentForm";
import styles from "./CDPurchaseCard.module.css";

interface CDPurchaseCardProps {
  address?: string;
  addressDetail?: string;
  name?: string;
  tel?: string;
  registeredMailCost?: number | string;
  onPayment?: () => void;
}

export default function CDPurchaseCard({
  address,
  addressDetail,
  name,
  tel,
  registeredMailCost,
  onPayment,
}: CDPurchaseCardProps) {
  const [isMedicalConsentChecked, setIsMedicalConsentChecked] = useState(false);

  return (
    <div className={styles.purchaseCard}>
      <DeliverInfoCard
        address={address}
        addressDetail={addressDetail}
        name={name}
        tel={tel}
        registeredMailCost={registeredMailCost}
      />
      <MedicalConsentForm
        checked={isMedicalConsentChecked}
        onCheckedChange={setIsMedicalConsentChecked}
      />
      <button
        className={styles.paymentButton}
        disabled={!isMedicalConsentChecked}
        onClick={onPayment}
        type="button"
      >
        결제하기
      </button>
    </div>
  );
}
