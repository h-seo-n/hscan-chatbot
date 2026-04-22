import type { Case } from "../../../../../core/util/types/caseTypes";
import styles from "./ImageCard.module.css";

interface ImageCardProps extends Pick<Case, "caseId" | "studyDescription" | "institutionName" | "modality" | "studyDate"> {
    isSelectable: boolean;
    isSelected?: boolean;   
    bodyPartLabel: string;
    thumbnailId: string;
    onSelect?: (caseId: string) => void;
}

// how to select only needed caseId, studyDescription, institutionName, modality and studyDate from Case type?
const ImageCard = ({ isSelectable, isSelected, bodyPartLabel, thumbnailId, onSelect, caseId, studyDescription, institutionName, modality, studyDate }: ImageCardProps) => {

    /** "20260320" → "2026.03.20" */
function formatStudyDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

    return (
    <button
        aria-pressed={isSelected}
        className={`${isSelectable ? styles.selectCard : styles.viewCard } ${isSelected ? styles.selected : ""}`}
        key={caseId}
        onClick={() => onSelect?.(caseId)}
        type="button"
        >
        {isSelectable &&
        <span
            aria-hidden="true"
            className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
        >
            {isSelected && <span className={styles.checkmark} />}
        </span> 
        }
            <span className={styles.thumbnail}>
                {thumbnailId ? (
                <img
                    alt={`${studyDescription} 썸네일`}
                    src={`${import.meta.env.HEALTHINFOHEALTHINFO_IMAGE_URL}${thumbnailId}`}
                />
                ) : (
                <span className={styles.thumbnailLabel}>영상 이미지</span>
                )}
            </span>

            <span className={styles.details}>
                <span className={styles.titleRow}>
                    <span className={styles.title}>{studyDescription || "-"}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.hospital}>{institutionName || "-"}</span>
                </span>
                <span className={styles.metaRow}>
                    <span className={styles.meta}>{bodyPartLabel}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.meta}>{modality}</span>
                </span>
                <span className={styles.date}>{`${formatStudyDate(studyDate)} 촬영`}</span>
            </span>
    </button>
    )
}

export default ImageCard;