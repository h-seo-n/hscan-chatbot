import type { Case } from "../../../../core/util/types/caseTypes";
import { useCaseStore } from "../../../../core/util/caseStore";
import { NextButton } from "../../widgets/NextButton";
import styles from "./HospitalImageList.module.css";

interface HospitalImageListProps {
  /** getImageByHospital 결과로 hydrate된, 아직 가져오지 않은 병원 영상들 */
  cases?: Case[];
  submitLabel?: string;
  onSelect: (caseId: string) => void; // 영상 선택/해제 시
  onSubmit: () => void;
}

/** DICOM modality 코드 → 한국어 검사 장비 라벨 */
const MODALITY_LABEL: Record<string, string> = {
  CT: "전산화단층촬영(CT)",
  MR: "자기공명영상검사(MRI)",
  CR: "일반촬영(CR)",
  DX: "디지털촬영(DX)",
  ECG: "심전도(ECG)",
  ES: "내시경(ES)",
  MG: "유방촬영(MG)",
  NM: "핵의학(NM)",
  PET: "양전자방출단층촬영(PET)",
  PT: "양전자방출단층촬영(PT)",
  RF: "투시촬영(RF)",
  US: "초음파(US)",
  XA: "혈관조영(XA)",
  XC: "일반사진(XC)",
  PX: "파노라마(PX)",
  OCT: "빛간섭단층촬영(OCT)",
  IVOCT: "혈관내광단층촬영(IVOCT)",
  IVUS: "혈관내초음파(IVUS)",
  OP: "안저촬영(OP)",
  OT: "기타(OT)",
};

/** 병원 영상 발급 상태 → 한국어 배지 라벨 */
const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "발급완료",
  IN_PROGRESS: "발급중",
  PENDING: "대기중",
  FAILED: "발급실패",
};

function modalityLabel(modality: string): string {
  return MODALITY_LABEL[modality] ?? modality;
}

/** "2026-03-19" 또는 "20260319" → "2026.03.19" */
function formatStudyDate(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return raw;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

export default function HospitalImageList({
  cases,
  submitLabel,
  onSelect,
  onSubmit,
}: HospitalImageListProps) {
  const selectedCases = useCaseStore((s) => s.selectedCases);
  const selectedIds = selectedCases.map((c) => c.caseId);
  const displayingCases: Case[] = cases ?? [];
  const buttonLabel = submitLabel ?? `${selectedIds.length}건 가져오기`;

  if (displayingCases.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.emptyState}>해당 병원에서 가져올 영상이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.list}>
          {displayingCases.map((item) => {
            const isSelected = selectedIds.includes(item.caseId);
            const title = item.studyDescription?.trim();
            const status = (item as Case & { status?: string }).status;
            const statusLabel = status
              ? (STATUS_LABEL[status] ?? status)
              : undefined;

            return (
              <div
                className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                key={item.caseId}
              >
                <button
                  aria-pressed={isSelected}
                  className={styles.header}
                  onClick={() => onSelect(item.caseId)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
                  >
                    {isSelected && <span className={styles.checkmark} />}
                  </span>
                  <span className={styles.title}>{title || " "}</span>
                  {statusLabel && <span className={styles.badge}>{statusLabel}</span>}
                </button>

                <dl className={styles.table}>
                  <dt className={styles.labelCell}>촬영 장비</dt>
                  <dd className={styles.valueCell}>{modalityLabel(item.modality)}</dd>
                  <dt className={styles.labelCell}>촬영 일자</dt>
                  <dd className={styles.valueCell}>{formatStudyDate(item.studyDate)}</dd>
                </dl>
              </div>
            );
          })}
        </div>

        <NextButton
          type="button"
          text={buttonLabel}
          canMoveOn={selectedIds.length > 0}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
}
