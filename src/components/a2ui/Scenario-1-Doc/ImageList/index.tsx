import { useMemo, useState } from "react";
import type { Image } from "../../../../core/util/types";
import styles from "./ImageList.module.css";

export type ImageListItem = Image;

interface ImageListProps {
  images?: ImageListItem[];
  submitLabel?: string;
  onSelect?: (imageIds: string[]) => void;
}

const fallbackImages: ImageListItem[] = [
  {
    id: "video-1",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
  },
  {
    id: "video-2",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
  },
];

export default function ImageList({
  images = [],
  submitLabel,
  onSelect,
}: ImageListProps) {
  const items = useMemo(
    () => (images.length > 0 ? images : fallbackImages),
    [images],
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
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.hospital}>{item.hospital}</span>
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
      </div>
    </div>
  );
}
