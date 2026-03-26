import styles from "./A2UI.module.css";

interface InfoCardProps {
  title?: string;
  body?: string;
  [key: string]: unknown;
}

/**
 * 정보 카드 A2UI 컴포넌트
 *
 * 단순 정보 표시용 카드 UI.
 *
 * TODO: 아이콘 / 이미지 지원
 * TODO: 접기/펼치기 지원
 * TODO: 링크 / 액션 버튼 지원
 */
export default function InfoCard({ title, body }: InfoCardProps) {
  return (
    <div className={styles.infoCard}>
      {title && <h4>{title}</h4>}
      {body && <p>{body}</p>}
    </div>
  );
}
