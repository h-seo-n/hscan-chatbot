import { useCaseStore } from "../../../../core/util/caseStore";
import ImageCard from "../ImageList/ImageCard";
import styles from "./SelectedImages.module.css";

/** "20260320" → "2026.03.20" */
function formatStudyDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

interface SelectedImagesProps {
  onRemove: (caseId: string) => void;
  onNotFound: () => void;
}

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

export default function SelectedImages({ onNotFound, onRemove }: SelectedImagesProps) {
  const selectedCases = useCaseStore((s) => s.selectedCases);

  return (
    <div className={styles.list}>
      {selectedCases.map((item) => {
        const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ") || "-";
        const thumbnailId = item.contentIds[0];

        return (
          <article className={styles.card} key={item.caseId}>
            <div className={styles.cardContent}>
              <ImageCard
                isSelectable={false}
                bodyPartLabel={bodyPartLabel} 
                thumbnailId={thumbnailId} 
                caseId={item.caseId} 
                studyDescription={item.studyDescription} 
                institutionName={item.institutionName} 
                modality={item.modality} 
                studyDate={item.studyDate} 
              />
              <button
                aria-label={`${item.studyDescription} 제거`}
                className={styles.removeButton}
                onClick={() => onRemove(item.caseId)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
          </article>
        );
      })}
      {onNotFound ? (
        <button className={styles.notFoundButton} onClick={onNotFound} type="button">
          찾는 영상이 없다
        </button>
      ) : null}
    </div>
  );
}
