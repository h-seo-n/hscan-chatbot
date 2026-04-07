import styles from "./SelectedImages.module.css";

export interface SelectedImageItem {
  id: string;
  title: string;
  hospital: string;
  capturedAt: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
}

interface SelectedImagesProps {
  images?: SelectedImageItem[];
  onRemove?: (imageId: string) => void;
}

const fallbackImages: SelectedImageItem[] = [
  {
    id: "selected-image-1",
    title: "영상 이름 1",
    hospital: "촬영 병원 1",
    capturedAt: "YYYY. MM. DD 촬영",
  },
  {
    id: "selected-image-2",
    title: "영상 이름 2",
    hospital: "촬영 병원 2",
    capturedAt: "YYYY. MM. DD 촬영",
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
  images = [],
  onRemove,
}: SelectedImagesProps) {
  const items = images.length > 0 ? images : fallbackImages;

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <article className={styles.card} key={item.id}>
          <div className={styles.cardContent}>
            <div className={styles.thumbnail}>
              {item.thumbnailUrl ? (
                <img
                  alt={item.thumbnailAlt ?? `${item.title} 썸네일`}
                  src={item.thumbnailUrl}
                />
              ) : (
                <span className={styles.thumbnailLabel}>영상 이미지</span>
              )}
            </div>

            <div className={styles.details}>
              <p className={styles.title}>{item.title}</p>
              <p className={styles.hospital}>{item.hospital}</p>
              <p className={styles.date}>{item.capturedAt}</p>
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
    </div>
  );
}
