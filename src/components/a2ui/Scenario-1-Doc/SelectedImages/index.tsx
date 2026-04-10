import type { Case } from "../../../../core/util/types";
import styles from "./SelectedImages.module.css";

export type SelectedImageItem = Case;

interface SelectedImagesProps {
  cases?: SelectedImageItem[];
  onRemove?: (imageId: string) => void;
  onNotFound?: () => void;
}

const fallbackCases: SelectedImageItem[] = [
  {
    id: "selected-image-1",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "Modality",
  },
  {
    id: "selected-image-2",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "Modality",
  },
];

const CloseIcon = () => (
  <svg
    aria-hidden="true"
    className={styles.closeIcon}
    fill="none"
    viewBox="0 0 22 21"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 5.25L5.5 15.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.5"
    />
    <path
      d="M5.5 5.25L16.5 15.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.5"
    />
  </svg>
);

export default function SelectedImages({
  cases = [],
  onRemove,
  onNotFound,
}: SelectedImagesProps) {
  const items = cases.length > 0 ? cases : fallbackCases;

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <article className={styles.card} key={item.id}>
          <div className={styles.cardContent}>
            <div className={styles.thumbnail}>
              {item.thumbnailUrl ? (
                <img
                  alt={`${item.title} 썸네일`}
                  src={item.thumbnailUrl}
                />
              ) : (
                <span className={styles.thumbnailLabel}>영상 이미지</span>
              )}
            </div>

            <div className={styles.details}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.hospital}>{item.hospital}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.meta}>{item.bodyPart}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.meta}>{item.modality}</span>
              </div>
              <span className={styles.date}>{item.capturedAt}</span>
            </div>

            <button
              aria-label={`${item.title} 제거`}
              className={styles.removeButton}
              onClick={() => onRemove?.(item.id)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </article>
      ))}
      {onNotFound ? (
        <button className={styles.notFoundButton} onClick={onNotFound} type="button">
          찾는 영상이 없다
        </button>
      ) : null}
    </div>
  );
}
