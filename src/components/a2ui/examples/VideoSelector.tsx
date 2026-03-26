import styles from "./A2UI.module.css";

interface Video {
  id: string;
  title: string;
  date: string;
  type: string;
  // TODO: 추가 필드 — 썸네일, 크기, 병원명, 상태 등
}

interface VideoSelectorProps {
  videos?: Video[];
  onSelect: (videoId: string) => void;
  [key: string]: unknown;
}

/**
 * 영상 선택 A2UI 컴포넌트
 *
 * 건강검진 영상(CT, MRI, X-ray 등) 목록에서 선택할 수 있는 UI.
 *
 * TODO: 영상 미리보기 (썸네일)
 * TODO: 다중 선택 지원
 * TODO: 영상 타입별 필터 (CT / MRI / X-ray 등)
 * TODO: 날짜순 정렬
 * TODO: 선택된 항목 수 / 용량 합계 표시
 */
export default function VideoSelector({
  videos = [],
  onSelect,
}: VideoSelectorProps) {
  return (
    <div className={styles.videoSelector}>
      <h4>영상을 선택해 주세요</h4>
      {videos.length === 0 ? (
        <p className={styles.empty}>조회된 영상이 없습니다.</p>
      ) : (
        <ul className={styles.videoList}>
          {videos.map((v) => (
            <li key={v.id}>
              <button onClick={() => onSelect(v.id)}>
                <span className={styles.videoType}>{v.type}</span>
                <strong>{v.title}</strong>
                <span className={styles.videoDate}>{v.date}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
