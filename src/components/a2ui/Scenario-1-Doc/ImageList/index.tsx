import { useMemo, useState } from "react";
import type { Case } from "../../../../core/util/types";
import styles from "./ImageList.module.css";

export type ImageListItem = Case;

interface ImageListProps {
  cases?: ImageListItem[];
  submitLabel?: string;
  onSelect?: (imageIds: string[]) => void;
  onNotFound?: () => void;
}

const fallbackCases: ImageListItem[] = [
  {
    id: "video-1",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "Modality",
  },
  {
    id: "video-2",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "Modality",
  },
];

export default function ImageList({
  cases = [],
  submitLabel,
  onSelect,
  onNotFound,
}: ImageListProps) {
  const items = useMemo(
    () => (cases.length > 0 ? cases : fallbackCases),
    [cases],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const buttonLabel = submitLabel ?? `${selectedCount}건 선택하기`;

  const handleSelect = (imageId: string) => {
    setSelectedIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId],
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      return;
    }

    onSelect?.(selectedIds);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.list}>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <button
                aria-pressed={isSelected}
                className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                key={item.id}
                onClick={() => handleSelect(item.id)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
                >
                  {isSelected && <span className={styles.checkmark} />}
                </span>

                <span className={styles.thumbnail}>
                  {item.thumbnailUrl ? (
                    <img
                      alt={`${item.title} 썸네일`}
                      src={item.thumbnailUrl}
                    />
                  ) : (
                    <span className={styles.thumbnailLabel}>영상 이미지</span>
                  )}
                </span>

                <span className={styles.details}>
                  <span className={styles.titleRow}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.hospital}>{item.hospital}</span>
                  </span>
                  <span className={styles.metaRow}>
                    <span className={styles.meta}>{item.bodyPart}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.meta}>{item.modality}</span>
                  </span>
                  <span className={styles.date}>{item.capturedAt}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          className={styles.submitButton}
          disabled={selectedIds.length === 0}
          onClick={handleSubmit}
          type="button"
        >
          {buttonLabel}
        </button>
        {onNotFound ? (
          <button
            className={styles.emptyStateButton}
            onClick={onNotFound}
            type="button"
          >
            찾는 영상이 없다
          </button>
        ) : null}
      </div>
    </div>
  );
}
