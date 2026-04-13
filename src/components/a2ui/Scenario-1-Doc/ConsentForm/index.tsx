import { useEffect, useMemo, useState } from "react";
import styles from "./ConsentForm.module.css";

interface ConsentFormProps {
  title?: string;
  items?: string[];
  onChange?: (selectedIds: string[], allChecked: boolean) => void;
}

const fallbackItems: string[] = [
      "해당 영상은 의료 목적에만 사용되며, 개인정보는 관련 법에 따라 안전하게 보호됩니다.",
      "영상에 판독문이 있을 경우 함께 전송됩니다.",
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
  // make sure no empty array passes through the prop
  const resolvedItems: string[] = useMemo(
    () => (items.length > 0 ? items : fallbackItems),
    [items],
  );

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isAllChecked =
    resolvedItems.length > 0 &&
    resolvedItems.every((item) => selectedItems.includes(item));

  useEffect(() => {
    onChange?.(selectedItems, isAllChecked);
  }, [isAllChecked, onChange, selectedItems]);
    
  const toggleAll = () => {
    setSelectedItems(isAllChecked ? [] : resolvedItems);
  };

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item) // remove
        : [...prev, item], // add
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
          className={`${styles.checkbox} ${styles.checkboxLarge} ${isAllChecked ? styles.checked : ""}`}
        >
          <CheckIcon />
        </span>
        <span className={styles.allConsentLabel}>{title}</span>
      </button>

      <div className={styles.itemList}>
        {resolvedItems.map((item) => {
          const isChecked = selectedItems.includes(item);

          return (
            <button
              aria-pressed={isChecked}
              className={styles.itemRow}
              onClick={() => toggleItem(item)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`${styles.checkbox} ${isChecked ? styles.checked : ""}`}
              >
                <CheckIcon />
              </span>
              <span className={styles.itemLabel}>{item}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
