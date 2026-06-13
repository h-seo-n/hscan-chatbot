import { useState } from "react";
import ConsentForm from "../../Scenario-1-Doc/ConsentForm";
import PurchaseTable, {
  calculatePurchaseTotal,
  fallbackPurchaseTableProps,
  formatWon,
  type PurchaseTableProps,
} from "./PurchaseTable";
import styles from "./PurchaseImaging.module.css";

interface PurchaseImagingProps extends Partial<PurchaseTableProps> {
  hospitalName?: string;
  sourceHospitalName?: string;
  destinationHospitalName?: string;
  onPayment?: () => void;
}

const fallbackHospitalName = "선택한 병원";

export default function PurchaseImaging({
  hospitalName,
  sourceHospitalName,
  destinationHospitalName,
  selectedVideoCount = fallbackPurchaseTableProps.selectedVideoCount,
  issueCost = fallbackPurchaseTableProps.issueCost,
  agencyFee = fallbackPurchaseTableProps.agencyFee,
  vat = fallbackPurchaseTableProps.vat,
  onPayment,
}: PurchaseImagingProps = {}) {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const purchaseTableProps = {
    selectedVideoCount,
    issueCost,
    agencyFee,
    vat,
  };
  const totalCost = calculatePurchaseTotal(purchaseTableProps);
  const displaySourceHospitalName = sourceHospitalName ?? hospitalName ?? fallbackHospitalName;

  return (
    <section className={styles.container} aria-label="영상 발급 결제">
      <h2 className={styles.hospitalName}>영상 발급 결제</h2>
      <dl className={styles.hospitalRoute}>
        <div>
          <dt>가져올 병원</dt>
          <dd>{displaySourceHospitalName}</dd>
        </div>
        {destinationHospitalName ? (
          <div>
            <dt>보낼 병원</dt>
            <dd>{destinationHospitalName}</dd>
          </div>
        ) : null}
      </dl>

      <PurchaseTable {...purchaseTableProps} />

      <ConsentForm
        onConfirm={() => setIsConsentChecked(true)}
      />

      <button
        className={styles.paymentButton}
        disabled={!isConsentChecked}
        onClick={onPayment}
        type="button"
      >
        {formatWon(totalCost)} 결제하기
      </button>
    </section>
  );
}
