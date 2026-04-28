import { useMemo, useState } from "react";
import styles from "./HospitalList.module.css";

export interface Hospital {
  id: string;
  name: string;
}

interface HospitalListProps {
  HospitalList?: Hospital[];
}

const fallbackHospitalList: Hospital[] = [
  {
    id: "seoul-hospital",
    name: "서울병원",
  },
  {
    id: "computer-clinic",
    name: "컴퓨터의원",
  },
];

export default function HospitalListComponent({
  HospitalList,
}: HospitalListProps) {
  const hospitals = useMemo(
    () =>
      HospitalList && HospitalList.length > 0
        ? HospitalList
        : fallbackHospitalList,
    [HospitalList],
  );

  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  const hasSelectedHospital = selectedHospitalId.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.list} role="radiogroup" aria-label="병원 선택">
        {hospitals.map((hospital) => {
          const isSelected = selectedHospitalId === hospital.id;

          return (
            <button
              aria-checked={isSelected}
              className={`${styles.option} ${isSelected ? styles.selected : ""}`}
              key={hospital.id}
              onClick={() => setSelectedHospitalId(hospital.id)}
              role="radio"
              type="button"
            >
              <span className={styles.radio} aria-hidden="true">
                {isSelected ? <span className={styles.radioDot} /> : null}
              </span>
              <span className={styles.hospitalName}>{hospital.name}</span>
            </button>
          );
        })}
      </div>

      <button
        className={styles.submitButton}
        disabled={!hasSelectedHospital}
        type="button"
      >
        선택하기
      </button>
    </div>
  );
}
