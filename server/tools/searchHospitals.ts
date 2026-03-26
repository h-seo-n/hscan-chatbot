/**
 * Tool: search_hospitals
 *
 * 사용자의 위치 또는 검색어 기반으로 병원 목록을 조회한다.
 *
 * TODO: HealthInfo API 연동하여 실제 병원 목록 조회
 * TODO: 입력 스키마 정의 (지역, 병원명, 좌표 등)
 * TODO: 응답 형식 정의 (병원 ID, 이름, 주소, 연락처 등)
 * TODO: 페이지네이션 지원
 */

export interface SearchHospitalsParams {
  query?: string;
  region?: string;
  lat?: number;
  lng?: number;
}

export interface HospitalResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

export async function searchHospitals(
  params: SearchHospitalsParams
): Promise<HospitalResult[]> {
  // TODO: HealthInfo API 호출
  // const response = await fetch(`${HEALTHINFO_API_URL}/hospitals?query=${params.query}`);
  console.log("[searchHospitals] params:", params);

  // placeholder
  return [
    { id: "h1", name: "서울대학교병원", address: "서울시 종로구" },
    { id: "h2", name: "세브란스병원", address: "서울시 서대문구" },
  ];
}
