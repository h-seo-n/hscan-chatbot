import { useEffect, useMemo, useState } from "react";
import styles from "./ConsentForm.module.css";

export interface ConsentFormItem {
  id: string;
  label: string;
  checked?: boolean;
}

interface ConsentFormProps {
  title?: string;
  items?: ConsentFormItem[];
  onChange?: (selectedIds: string[], allChecked: boolean) => void;
}

const fallbackItems: ConsentFormItem[] = [
  {
    id: "medical-use",
    label:
      "해당 영상은 의료 목적에만 사용되며, 개인정보는 관련 법에 따라 안전하게 보호됩니다.",
    checked: true,
  },
  {
    id: "subtitle-share",
    label: "영상에 판독문이 있을 경우 함께 전송됩니다.",
    checked: true,
  },
];

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className={styles.checkIcon}
    fill="none"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.2 10.1L8.4 13.3L14.8 6.9"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
    />
  </svg>
);

export default function ConsentForm({
  title = "전체 동의",
  items = fallbackItems,
  onChange,
}: ConsentFormProps) {
  const resolvedItems = useMemo(
    () => (items.length > 0 ? items : fallbackItems),
    [items],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(
    resolvedItems.filter((item) => item.checked).map((item) => item.id),
  );

  useEffect(() => {
    setSelectedIds(
      resolvedItems.filter((item) => item.checked).map((item) => item.id),
    );
  }, [resolvedItems]);

  const isAllChecked =
    resolvedItems.length > 0 &&
    resolvedItems.every((item) => selectedIds.includes(item.id));

  useEffect(() => {
    onChange?.(selectedIds, isAllChecked);
  }, [isAllChecked, onChange, selectedIds]);

  const toggleAll = () => {
    setSelectedIds(isAllChecked ? [] : resolvedItems.map((item) => item.id));
  };

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  return (
    <section className={styles.card}>
      <button
        aria-pressed={isAllChecked}
        className={`${styles.allConsentButton} ${isAllChecked ? styles.allConsentButtonChecked : ""}`}
        onClick={toggleAll}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`${styles.checkbox} ${styles.checkboxLarge} ${isAllChecked ? styles.checkboxChecked : ""}`}
        >
          <CheckIcon />
        </span>
        <span className={styles.allConsentLabel}>{title}</span>
      </button>

      <div className={styles.itemList}>
        {resolvedItems.map((item) => {
          const isChecked = selectedIds.includes(item.id);

          return (
            <button
              aria-pressed={isChecked}
              className={styles.itemRow}
              key={item.id}
              onClick={() => toggleItem(item.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ""}`}
              >
                <CheckIcon />
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
