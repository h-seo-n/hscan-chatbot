import { useEffect, useMemo, useRef, useState } from "react";
import type { Case } from "../../../../core/util/types/caseTypes";
import ImageCard from "../../Scenario-1-Doc/ImageList/ImageCard";
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
    caseId: "video-1",
    patientId: "P001",
    birthDate: "19900101",
    patientName: "테스트^환자1",
    patientSex: "M",
    studyDate: "20260101",
    accessionNumber: null,
    studyInstanceUID: "1.2.3.4.5.1",
    studyDescription: "영상 이름",
    modality: "CT",
    institutionName: "촬영 병원",
    imageHash: {},
    bodyPart: ["촬영 부위"],
    series: [],
    createdAt: null,
    userId: "user1",
    requestedDate: "2026-01-01T00:00:00Z",
    acceptedDate: "2026-01-01T00:00:00Z",
    locked: false,
    contentIds: [],
  },
  {
    caseId: "video-2",
    patientId: "P002",
    birthDate: "19900102",
    patientName: "테스트^환자2",
    patientSex: "F",
    studyDate: "20260102",
    accessionNumber: null,
    studyInstanceUID: "1.2.3.4.5.2",
    studyDescription: "영상 이름",
    modality: "MR",
    institutionName: "촬영 병원",
    imageHash: {},
    bodyPart: ["촬영 부위"],
    series: [],
    createdAt: null,
    userId: "user1",
    requestedDate: "2026-01-02T00:00:00Z",
    acceptedDate: "2026-01-02T00:00:00Z",
    locked: false,
    contentIds: [],
  },
  {
    caseId: "video-3",
    patientId: "P003",
    birthDate: "19900103",
    patientName: "테스트^환자3",
    patientSex: "O",
    studyDate: "20260103",
    accessionNumber: null,
    studyInstanceUID: "1.2.3.4.5.3",
    studyDescription: "영상 이름",
    modality: "US",
    institutionName: "촬영 병원",
    imageHash: {},
    bodyPart: ["촬영 부위"],
    series: [],
    createdAt: null,
    userId: "user1",
    requestedDate: "2026-01-03T00:00:00Z",
    acceptedDate: "2026-01-03T00:00:00Z",
    locked: false,
    contentIds: [],
  },
  {
    caseId: "video-4",
    patientId: "P004",
    birthDate: "19900104",
    patientName: "테스트^환자4",
    patientSex: "M",
    studyDate: "20260104",
    accessionNumber: null,
    studyInstanceUID: "1.2.3.4.5.4",
    studyDescription: "영상 이름",
    modality: "CT",
    institutionName: "촬영 병원",
    imageHash: {},
    bodyPart: ["촬영 부위"],
    series: [],
    createdAt: null,
    userId: "user1",
    requestedDate: "2026-01-04T00:00:00Z",
    acceptedDate: "2026-01-04T00:00:00Z",
    locked: false,
    contentIds: [],
  },
  {
    caseId: "video-5",
    patientId: "P005",
    birthDate: "19900105",
    patientName: "테스트^환자5",
    patientSex: "F",
    studyDate: "20260105",
    accessionNumber: null,
    studyInstanceUID: "1.2.3.4.5.5",
    studyDescription: "영상 이름",
    modality: "MR",
    institutionName: "촬영 병원",
    imageHash: {},
    bodyPart: ["촬영 부위"],
    series: [],
    createdAt: null,
    userId: "user1",
    requestedDate: "2026-01-05T00:00:00Z",
    acceptedDate: "2026-01-05T00:00:00Z",
    locked: false,
    contentIds: [],
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

    onSelect?.(selectedIds);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.listWrap}>
          <div className={styles.list} ref={listRef}>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.caseId);
              const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ") || "-";
              const thumbnailId = item.contentIds[0];

              return (
                <ImageCard
                  key={item.caseId}
                  isSelectable={true}
                  isSelected={isSelected}
                  bodyPartLabel={bodyPartLabel}
                  thumbnailId={thumbnailId}
                  onSelect={handleSelect}
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
