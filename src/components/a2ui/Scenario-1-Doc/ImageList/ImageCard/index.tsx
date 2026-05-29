import { useEffect, useState } from "react";
import type { Case } from "../../../../../core/util/types/caseTypes";
import styles from "./ImageCard.module.css";
import { createAuthenticatedFetch } from "../../../../../core/util/auth/authFetch";
import { useAuth } from "../../../../../core/util/auth/useAuth";

interface ImageCardProps extends Pick<Case, "caseId" | "studyDescription" | "institutionName" | "modality" | "studyDate"> {
    isSelectable: boolean;
    isSelected?: boolean;
    bodyPartLabel: string;
    thumbnailId: string;
    onSelect?: (caseId: string) => void;
}

// how to select only needed caseId, studyDescription, institutionName, modality and studyDate from Case type?
const ImageCard = ({ isSelectable, isSelected, bodyPartLabel, thumbnailId, onSelect, caseId, studyDescription, institutionName, modality, studyDate }: ImageCardProps) => {
    const [thumbnailSrc, setThumbnailSrc] = useState<string>("");
    const { accessToken } = useAuth();

    useEffect(() => {
        if (!thumbnailId) {
            setThumbnailSrc("");
            return;
        }
        const authFetch = createAuthenticatedFetch(() => accessToken);
        let objectUrl: string | undefined;
        let cancelled = false;
        authFetch(`${import.meta.env.VITE_HEALTHINFO_API_URL}image/${thumbnailId}`)
            .then((res) => res.blob())
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setThumbnailSrc(objectUrl);
            });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [thumbnailId, accessToken]);

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
            <div className={styles.thumbnail}>
                {thumbnailSrc ? (
                <img
                    alt={`${studyDescription || "영상"} 썸네일`}
                    src={thumbnailSrc}
                />
                ) : (
                <span className={styles.thumbnailLabel}>영상 이미지</span>
                )}
            </div>

            <div className={styles.details}>
                {(studyDescription || institutionName) && (
                    <div className={styles.titleRow}>
                        {studyDescription && (
                            <span className={styles.title}>{studyDescription}</span>
                        )}
                        {studyDescription && institutionName && (
                            <span className={styles.separator}>|</span>
                        )}
                        {institutionName && (
                            <span className={styles.hospital}>{institutionName}</span>
                        )}
                    </div>
                )}
                {(bodyPartLabel || modality) && (
                    <div className={styles.metaRow}>
                        {bodyPartLabel && (
                            <span className={styles.meta}>{bodyPartLabel}</span>
                        )}
                        {bodyPartLabel && modality && (
                            <span className={styles.separator}>|</span>
                        )}
                        {modality && (
                            <span className={styles.meta}>{modality}</span>
                        )}
                    </div>
                )}
                <div className={styles.date}>{`${formatStudyDate(studyDate)} 촬영`}</div>
            </div>
    </button>
    )
}

export default ImageCard;