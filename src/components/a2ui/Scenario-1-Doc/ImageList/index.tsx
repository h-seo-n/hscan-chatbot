import { useMemo, useState } from "react";
import styles from "./ImageList.module.css";
import type { Case } from "../../../../core/util/types/caseTypes";
import { useCaseStore } from "../../../../core/util/caseStore";
import { NextButton } from "../../widgets/NextButton";
import ImageCard from "./ImageCard";
import DetailModalOverlay from "../../Scenario-7-Down/DetailModal/DetailModalOverlay";

interface ImageListProps {
  cases?: Case[]; // LLM이 tool 실행 결과로 반환하는 영상들
  submitLabel?: string;
  onSelect: (caseIds: string) => void; // 영상 선택 시
  onSubmit: () => void;
  onNotFound: () => void; // '찾는 영상이 없다' 클릭 시
}

export default function ImageList({ cases, submitLabel, onSelect, onSubmit, onNotFound }: ImageListProps) {
  const selectedCases = useCaseStore((s) => s.selectedCases);
  const selectedIds = selectedCases.map((c) => c.caseId);
  // 실제로 ImageList에서 표시하는 영상 : prop으로 전달되는 영상목록 (없으면 빈 목록)
  const displayingCases: Case[] = cases ?? [];
  const buttonLabel = submitLabel ?? `${selectedIds.length}건 선택하기`;

  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const detailCase = useMemo(
    () => displayingCases.find((item) => item.caseId === detailCaseId) ?? null,
    [displayingCases, detailCaseId],
  );

  if (displayingCases.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.emptyState}>표시할 영상이 없습니다.</p>
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
            const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ");
            const thumbnailId = item.contentIds[0];

            return (
              <ImageCard
                key={item.caseId}
                isSelectable={true}
                isSelected={isSelected}
                bodyPartLabel={bodyPartLabel}
                thumbnailId={thumbnailId}
                onSelect={onSelect}
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
        <NextButton type="button" text={buttonLabel} canMoveOn={selectedIds.length > 0} onClick={onSubmit}/>
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
