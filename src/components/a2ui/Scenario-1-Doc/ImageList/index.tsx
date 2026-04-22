import { useState } from "react";
import { mockCases } from "../../../../core/util/mockCases";
import styles from "./ImageList.module.css";
import type { Case } from "../../../../core/util/types/caseTypes";

interface ImageListProps {
  images?: Case[]; // LLM이 tool 실행 결과로 반환하는 영상들
  submitLabel?: string;
  onSelect: (caseIds: string[]) => void; // 영상 선택 시
  onNotFound: () => void; // '찾는 영상이 없다' 클릭 시
}

/** "20260320" → "2026.03.20" */
function formatStudyDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

export default function ImageList({ images, submitLabel, onSelect, onNotFound }: ImageListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 실제로 ImageList에서 표시하는 영상 : prop으로 전달되는 영상목록 우선, 없을 경우 mock 데이터
  const displayingCases: Case[] = images ?? mockCases;

  const selectedCount = selectedIds.length;
  const buttonLabel = submitLabel ?? `${selectedCount}건 선택하기`;

  const handleSelect = (caseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId],
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    onSelect?.(selectedIds);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.list}>
          {displayingCases.map((item) => {
            const isSelected = selectedIds.includes(item.caseId);
            const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ") || "-";
            const thumbnailId = item.contentIds[0];

            return (
              <button
                aria-pressed={isSelected}
                className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                key={item.caseId}
                onClick={() => handleSelect(item.caseId)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
                >
                  {isSelected && <span className={styles.checkmark} />}
                </span>

                <span className={styles.thumbnail}>
                  {thumbnailId ? (
                    <img
                      alt={`${item.studyDescription} 썸네일`}
                      src={`${import.meta.env.HEALTHINFOHEALTHINFO_IMAGE_URL}${thumbnailId}`}
                    />
                  ) : (
                    <span className={styles.thumbnailLabel}>영상 이미지</span>
                  )}
                </span>

                <span className={styles.details}>
                  <span className={styles.titleRow}>
                    <span className={styles.title}>{item.studyDescription || "-"}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.hospital}>{item.institutionName || "-"}</span>
                  </span>
                  <span className={styles.metaRow}>
                    <span className={styles.meta}>{bodyPartLabel}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.meta}>{item.modality}</span>
                  </span>
                  <span className={styles.date}>{`${formatStudyDate(item.studyDate)} 촬영`}</span>
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
