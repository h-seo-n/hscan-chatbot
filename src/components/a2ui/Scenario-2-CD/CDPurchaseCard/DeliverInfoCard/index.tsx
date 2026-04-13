import styles from "./DeliverInfoCard.module.css";

interface DeliverInfoCardProps {
  address?: string;
  addressDetail?: string;
  name?: string;
  tel?: string;
  registeredMailCost?: number | string;
  onChange?: () => void;
}

const fallbackDeliverInfo: Required<
  Pick<DeliverInfoCardProps,
    "address" | "addressDetail" | "name" | "tel" | "registeredMailCost"
  >
> = {
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "101호",
  name: "홍길동",
  tel: "010-1234-5678",
  registeredMailCost: 4500,
};

const formatRegisteredMailCost = (cost: number | string) => {
  if (typeof cost === "number") {
    return `${cost.toLocaleString("ko-KR")}원`;
  }

  return cost;
};

export default function DeliverInfoCard({
  address,
  addressDetail,
  name,
  tel,
  registeredMailCost,
  onChange,
}: DeliverInfoCardProps) {
  const resolvedAddress = address ?? fallbackDeliverInfo.address;
  const resolvedAddressDetail = addressDetail ?? fallbackDeliverInfo.addressDetail;
  const resolvedName = name ?? fallbackDeliverInfo.name;
  const resolvedTel = tel ?? fallbackDeliverInfo.tel;
  const resolvedRegisteredMailCost =
    registeredMailCost ?? fallbackDeliverInfo.registeredMailCost;

  const fullAddress = `${resolvedAddress}, ${resolvedAddressDetail}`;
  const recipientInfo = `${resolvedName} (${resolvedTel})`;
  const costLabel = formatRegisteredMailCost(resolvedRegisteredMailCost);

  return (
    <section className={styles.card} aria-labelledby="deliver-info-title">
      <div className={styles.infoSection}>
        <h2 className={styles.title} id="deliver-info-title">
          등기우편 발송 주소지 / 수령인 정보
        </h2>

        <div className={styles.recipientPanel}>
          <div className={styles.recipientText}>
            <p>{fullAddress}</p>
            <p>{recipientInfo}</p>
          </div>

          <button
            className={styles.changeButton}
            disabled={!onChange}
            onClick={onChange}
            type="button"
          >
            변경
          </button>
        </div>
      </div>

      <div className={styles.costRow}>
        <p className={styles.costTitle}>등기우편 비용</p>
        <div className={styles.costValue} aria-label={`등기우편 비용 ${costLabel}`}>
          {costLabel}
        </div>
      </div>
    </section>
  );
}
