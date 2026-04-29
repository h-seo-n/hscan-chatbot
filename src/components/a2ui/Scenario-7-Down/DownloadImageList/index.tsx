import { useEffect, useMemo, useRef, useState } from "react";
import type { Case } from "../../../../core/util/types";
import styles from "./DownloadImageList.module.css";

export type DownloadImageListItem = Case;

interface DownloadImageListProps {
  cases?: DownloadImageListItem[];
  submitLabel?: string;
  onSelect?: (imageIds: string[]) => void;
  onNotFound?: () => void;
}

const fallbackCases: DownloadImageListItem[] = [
  {
    id: "video-1",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "modality",
  },
  {
    id: "video-2",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "modality",
  },
  {
    id: "video-3",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "modality",
  },
    {
    id: "video-3",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "modality",
  },
    {
    id: "video-3",
    title: "영상 이름",
    hospital: "촬영 병원",
    capturedAt: "YYYY. MM. DD 촬영",
    bodyPart: "촬영 부위",
    modality: "modality",
  },
];

export default function DownloadImageList({
  cases = [],
  submitLabel,
  onSelect,
  onNotFound,
}: DownloadImageListProps) {
  const items = useMemo(
    () => (cases.length > 0 ? cases : fallbackCases),
    [cases],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number>();

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
    const itemIds = new Set(items.map((item) => item.id));

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
        <div className={styles.listWrap}>
          <div className={styles.list} ref={listRef} onScroll={handleScroll}>
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

                  <span aria-hidden="true" className={styles.chevron} />
                </button>
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
