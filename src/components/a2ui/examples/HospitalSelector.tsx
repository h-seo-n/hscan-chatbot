import styles from "./A2UI.module.css";

interface Hospital {
  id: string;
  name: string;
  address: string;
  // TODO: 추가 필드 — 전화번호, 진료과목, 거리, 평점 등
}

interface HospitalSelectorProps {
  hospitals?: Hospital[];
  onSelect: (hospitalId: string) => void;
  [key: string]: unknown;
}

/**
 * 병원 선택 A2UI 컴포넌트
 *
 * 사용자가 건강검진 영상을 조회할 병원을 선택할 수 있는 UI.
 *
 * TODO: 병원 검색/필터 기능
 * TODO: 지도 연동 (카카오맵 / 네이버맵)
 * TODO: 병원 상세 정보 팝오버
 * TODO: 선택된 병원 하이라이트
 * TODO: 로딩 상태 & 빈 목록 처리
 */
export default function HospitalSelector({
  hospitals = [],
  onSelect,
}: HospitalSelectorProps) {
  return (
    <div className={styles.hospitalSelector}>
      <h4>병원을 선택해 주세요</h4>
      {hospitals.length === 0 ? (
        <p className={styles.empty}>조회된 병원이 없습니다.</p>
      ) : (
        <ul className={styles.hospitalList}>
          {hospitals.map((h) => (
            <li key={h.id}>
              <button onClick={() => onSelect(h.id)}>
                <strong>{h.name}</strong>
                <span>{h.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
