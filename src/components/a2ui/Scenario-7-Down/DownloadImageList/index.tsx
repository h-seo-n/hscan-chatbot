import { useEffect, useMemo, useRef, useState } from "react";
import type { Case } from "../../../../core/util/types/caseTypes";
import ImageCard from "../../Scenario-1-Doc/ImageList/ImageCard";
import DetailModalOverlay from "../DetailModal/DetailModalOverlay";
import styles from "./DownloadImageList.module.css";

export type DownloadImageListItem = Case;

export type DownloadFileType = "jpeg" | "dicom";

const FILE_TYPE_OPTIONS: { value: DownloadFileType; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "dicom", label: "DICOM" },
];

interface DownloadImageListProps {
  cases?: DownloadImageListItem[];
  submitLabel?: string;
  onSelect?: (imageIds: string[], fileType: DownloadFileType) => void;
  onNotFound?: () => void;
}

export default function DownloadImageList({
  cases = [],
  submitLabel,
  onSelect,
  onNotFound,
}: DownloadImageListProps) {
  const items = cases;
  const isEmpty = items.length === 0;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fileType, setFileType] = useState<DownloadFileType>("jpeg");
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const buttonLabel = submitLabel ?? "선택한 영상들 다운로드";

  const handleScroll = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!listRef.current || !thumbRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const scrollableHeight = scrollHeight - clientHeight;
      const scrollPercent = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;
      const thumbHeight = (clientHeight / scrollHeight) * 385;
      const thumbTop = scrollPercent * (385 - thumbHeight) + 3;

      thumbRef.current.style.top = `${thumbTop}px`;
      thumbRef.current.style.height = `${Math.max(thumbHeight, 30)}px`;
    });
  };

  useEffect(() => {
    const itemIds = new Set(items.map((item) => item.caseId));

    setSelectedIds((prev) => prev.filter((id) => itemIds.has(id)));
    handleScroll();
  }, [items]);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    listElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      listElement.removeEventListener("scroll", handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleSelect = (caseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId],
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      return;
    }

    onSelect?.(selectedIds, fileType);
  };

  const detailCase = useMemo(
    () => items.find((item) => item.caseId === detailCaseId) ?? null,
    [items, detailCaseId],
  );

  if (isEmpty) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.emptyMessage}>영상이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.listWrap}>
          <div className={styles.list} ref={listRef}>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.caseId);
              const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ");
              const thumbnailId = item.contentIds[0];

              return (
                <ImageCard
                  key={item.caseId}
                  isSelectable={true}
                  isSelected={isSelected}
                  bodyPartLabel={bodyPartLabel}
                  thumbnailId={thumbnailId}
                  onSelect={handleSelect}
                  onDetail={setDetailCaseId}
                  caseId={item.caseId}
                  studyDescription={item.studyDescription}
                  institutionName={item.institutionName}
                  modality={item.modality}
                  studyDate={item.studyDate}
                />
              );
            })}
          </div>
          <span aria-hidden="true" className={styles.scrollbar}>
            <span
              ref={thumbRef}
              className={styles.scrollbarThumb}
              style={{
                top: "3px",
                height: "190px",
              }}
            />
          </span>
        </div>

        <div
          className={styles.formatToggle}
          role="radiogroup"
          aria-label="다운로드 파일 형식"
        >
          {FILE_TYPE_OPTIONS.map((option) => {
            const isActive = fileType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`${styles.formatOption} ${isActive ? styles.formatOptionActive : ""}`}
                onClick={() => setFileType(option.value)}
              >
                {option.label}
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

      {detailCase ? (
        <DetailModalOverlay
          series={detailCase.series}
          onClose={() => setDetailCaseId(null)}
        />
      ) : null}
    </div>
  );
}
