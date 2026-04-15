import { useState } from "react";
import ConsentForm from "../../Scenario-1-Doc/ConsentForm";
import PurchaseTable, {
  calculatePurchaseTotal,
  fallbackPurchaseTableProps,
  formatWon,
  type PurchaseTableProps,
} from "./PurchaseTable";
import styles from "./PurchaseImaging.module.css";

interface PurchaseImagingProps extends PurchaseTableProps {
  hospitalName?: string;
}

const fallbackHospitalName = "서울병원";

export default function PurchaseImaging({
  hospitalName = fallbackHospitalName,
  selectedVideoCount = fallbackPurchaseTableProps.selectedVideoCount,
  issueCost = fallbackPurchaseTableProps.issueCost,
  agencyFee = fallbackPurchaseTableProps.agencyFee,
  vat = fallbackPurchaseTableProps.vat,
}: PurchaseImagingProps = {}) {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const purchaseTableProps = {
    selectedVideoCount,
    issueCost,
    agencyFee,
    vat,
  };
  const totalCost = calculatePurchaseTotal(purchaseTableProps);

  return (
    <section className={styles.container} aria-label="영상 발급 결제">
      <h2 className={styles.hospitalName}>{hospitalName}</h2>

      <PurchaseTable {...purchaseTableProps} />

      <ConsentForm
        onChange={(_, allChecked) => {
          setIsConsentChecked(allChecked);
        }}
      />

      <button
        className={styles.paymentButton}
        disabled={!isConsentChecked}
        type="button"
      >
        {formatWon(totalCost)} 결제하기
      </button>
    </section>
  );
}
