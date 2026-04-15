import styles from "./PurchaseTable.module.css";

type PriceValue = number | string;

export interface PurchaseTableProps {
  selectedVideoCount?: number | string;
  issueCost?: PriceValue;
  agencyFee?: PriceValue;
  vat?: PriceValue;
}

export const fallbackPurchaseTableProps = {
  selectedVideoCount: 1,
  issueCost: 9000,
  agencyFee: 364,
  vat: 936,
} satisfies Required<PurchaseTableProps>;

export const parsePrice = (value: PriceValue) => {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatWon = (value: PriceValue) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return "0원";
  }

  const numericValue = parsePrice(value);

  return `${numericValue.toLocaleString("ko-KR")}원`;
};

export const calculatePurchaseTotal = ({
  issueCost = fallbackPurchaseTableProps.issueCost,
  agencyFee = fallbackPurchaseTableProps.agencyFee,
  vat = fallbackPurchaseTableProps.vat,
}: Pick<PurchaseTableProps, "issueCost" | "agencyFee" | "vat"> = {}) =>
  parsePrice(issueCost) + parsePrice(agencyFee) + parsePrice(vat);

export default function PurchaseTable({
  selectedVideoCount = fallbackPurchaseTableProps.selectedVideoCount,
  issueCost = fallbackPurchaseTableProps.issueCost,
  agencyFee = fallbackPurchaseTableProps.agencyFee,
  vat = fallbackPurchaseTableProps.vat,
}: PurchaseTableProps = fallbackPurchaseTableProps) {
  const totalCost = calculatePurchaseTotal({ issueCost, agencyFee, vat });
  const detailRows = [
    { label: "발급 비용", value: issueCost },
    { label: "대행 수수료", value: agencyFee },
    { label: "부가세", value: vat },
  ];

  return (
    <section className={styles.table} aria-label="영상 발급 비용">
      <div className={styles.labelCell}>목록</div>
      <div className={styles.headerCell}>검사 {selectedVideoCount} 건</div>

      <div className={styles.labelCell}>발급비</div>
      <div className={styles.priceCell}>
        <strong className={styles.totalPrice}>{formatWon(totalCost)}</strong>

        <dl className={styles.detailList}>
          {detailRows.map((row) => (
            <div className={styles.detailRow} key={row.label}>
              <dt>{row.label}</dt>
              <dd>{formatWon(row.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
