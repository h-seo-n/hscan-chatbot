import type { ChangeEvent, CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import type { Case } from "../../../../core/util/types/caseTypes";
import styles from "./DetailModal.module.css";

interface DetailModalProps {
  series?: Case["series"];
  onClose?: () => void;
}

const IMAGE_BASE_URL = import.meta.env.HEALTHINFOHEALTHINFO_IMAGE_URL as string | undefined;

const fallbackCase: Case = {
  caseId: "fallback-case",
  patientId: "fallback-patient",
  birthDate: "19900101",
  patientName: "Fallback^Patient",
  patientSex: "O",
  studyDate: "20260430",
  accessionNumber: null,
  studyInstanceUID: "fallback-study-instance",
  studyDescription: "Fallback study",
  modality: "CT",
  institutionName: "Fallback hospital",
  imageHash: {},
  bodyPart: ["CHEST"],
  series: [
    {
      seriesNumber: "1",
      seriesInstanceUID: "fallback-series-1",
      seriesDescription: "Fallback axial series",
      images: ["fallback-image-1", "fallback-image-2", "fallback-image-3"],
    },
    {
      seriesNumber: "2",
      seriesInstanceUID: "fallback-series-2",
      seriesDescription: "Fallback coronal series",
      images: ["fallback-image-4", "fallback-image-5"],
    },
  ],
  createdAt: null,
  userId: "fallback-user",
  requestedDate: "2026-04-30T00:00:00.000Z",
  acceptedDate: "2026-04-30T00:00:00.000Z",
  locked: false,
  contentIds: [
    "fallback-image-1",
    "fallback-image-2",
    "fallback-image-3",
    "fallback-image-4",
    "fallback-image-5",
  ],
};

export default function DetailModal({
  series,
  onClose = () => undefined,
}: DetailModalProps) {
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const resolvedSeries = series?.length ? series : fallbackCase.series;

  const activeSeries = resolvedSeries[activeSeriesIndex];
  const images = useMemo(() => activeSeries?.images ?? [], [activeSeries]);
  const currentImageId = images[activeImageIndex];
  const imageSrc = currentImageId && IMAGE_BASE_URL ? `${IMAGE_BASE_URL}${currentImageId}` : "";
  const totalImages = images.length;
  const displayedImageNumber = totalImages > 0 ? activeImageIndex + 1 : 0;
  const sliderMax = Math.max(totalImages - 1, 0);
  const sliderProgress = sliderMax > 0 ? (activeImageIndex / sliderMax) * 100 : 0;
  const sliderStyle = {
    "--slider-progress": `${sliderProgress}%`,
  } as CSSProperties;

  useEffect(() => {
    setActiveSeriesIndex((currentIndex) =>
      resolvedSeries[currentIndex] ? currentIndex : 0,
    );
  }, [resolvedSeries]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeSeriesIndex]);

  useEffect(() => {
    setActiveImageIndex((currentIndex) =>
      currentIndex < totalImages ? currentIndex : Math.max(totalImages - 1, 0),
    );
  }, [totalImages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSeriesSelect = (seriesIndex: number) => {
    setActiveSeriesIndex(seriesIndex);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActiveImageIndex(Number(event.target.value));
  };

  return (
    <section
      aria-labelledby="detail-modal-title"
      aria-modal="true"
      className={styles.modal}
      role="dialog"
    >
      <header className={styles.header}>
        <h2 className={styles.title} id="detail-modal-title">
          영상 확대해서 보기
        </h2>
        <button
          aria-label="상세 보기 닫기"
          className={styles.closeButton}
          onClick={onClose}
          type="button"
        >
          <IoClose aria-hidden="true" />
        </button>
      </header>

      <div aria-label="시리즈 선택" className={styles.seriesTabs} role="tablist">
        {resolvedSeries.map((item, index) => {
          const isActive = index === activeSeriesIndex;
          const label = item.seriesNumber ?? String(index + 1);

          return (
            <button
              aria-selected={isActive}
              className={`${styles.seriesTab} ${isActive ? styles.activeSeriesTab : ""}`}
              key={item.seriesInstanceUID}
              onClick={() => handleSeriesSelect(index)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <figure className={styles.imageViewport}>
        {imageSrc ? (
          <img
            alt={`${activeSeries?.seriesDescription ?? "영상"} ${displayedImageNumber}`}
            className={styles.image}
            src={imageSrc}
          />
        ) : (
          <span className={styles.imagePlaceholder}>영상 이미지</span>
        )}
      </figure>

      <div className={styles.imageControls}>
        <input
          aria-label="영상 이미지 순서"
          className={styles.slider}
          disabled={totalImages <= 1}
          max={sliderMax}
          min={0}
          onChange={handleImageChange}
          style={sliderStyle}
          type="range"
          value={activeImageIndex}
        />
        <span className={styles.counter}>
          {displayedImageNumber} / {totalImages}
        </span>
      </div>

      <div className={styles.reportBox}>
        <strong>판독문 : &#123;string&#125;</strong>
      </div>
    </section>
  );
}
