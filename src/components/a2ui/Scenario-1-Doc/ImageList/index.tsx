import { mockCases } from "../../../../core/util/mockCases";
import styles from "./ImageList.module.css";
import type { Case } from "../../../../core/util/types/caseTypes";
import { useCaseStore } from "../../../../core/util/caseStore";
import { NextButton } from "../../widgets/NextButton";
import ImageCard from "./ImageCard";

interface ImageListProps {
  images?: Case[]; // LLM이 tool 실행 결과로 반환하는 영상들
  submitLabel?: string;
  onSelect: (caseIds: string) => void; // 영상 선택 시
  onSubmit: () => void;
  onNotFound: () => void; // '찾는 영상이 없다' 클릭 시
}

export default function ImageList({ images, submitLabel, onSelect, onSubmit, onNotFound }: ImageListProps) {
  const selectedCases = useCaseStore((s) => s.selectedCases);
  const selectedIds = selectedCases.map((c) => c.caseId);
  // 실제로 ImageList에서 표시하는 영상 : prop으로 전달되는 영상목록 우선, 없을 경우 mock 데이터
  const displayingCases: Case[] = images ?? mockCases;
  const buttonLabel = submitLabel ?? `${selectedIds}건 선택하기`;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.list}>
          {displayingCases.map((item) => {
            const isSelected = selectedIds.includes(item.caseId);
            const bodyPartLabel = item.bodyPart.filter(Boolean).join(", ") || "-";
            const thumbnailId = item.contentIds[0];

            return (
              <ImageCard 
                isSelectable={true}
                isSelected={isSelected} 
                bodyPartLabel={bodyPartLabel} 
                thumbnailId={thumbnailId} 
                onSelect={onSelect} 
                caseId={item.caseId} 
                studyDescription={item.studyDescription} 
                institutionName={item.institutionName} 
                modality={item.modality} 
                studyDate={item.studyDate} 
              />
            );
          })}
        </div>
        <NextButton type="button" text={buttonLabel} canMoveOn={selectedIds.length === 0} onClick={onSubmit}/>
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
