/**
 * Tool: get_videos
 *
 * 특정 병원 + 환자에 대한 건강검진 영상 목록을 조회한다.
 *
 * TODO: HealthInfo API 연동
 * TODO: 환자 인증 처리 (본인확인)
 * TODO: 영상 메타데이터 조회 (타입, 날짜, 크기, DICOM 정보 등)
 * TODO: 입력/출력 스키마 정의
 */

export interface GetVideosParams {
  hospitalId: string;
  patientId?: string;
  // TODO: 날짜 범위, 영상 타입 필터 등
}

export interface VideoResult {
  id: string;
  title: string;
  date: string;
  type: string; // CT, MRI, X-ray 등
  size?: number;
}

export async function getVideos(
  params: GetVideosParams
): Promise<VideoResult[]> {
  // TODO: HealthInfo API 호출
  console.log("[getVideos] params:", params);

  // placeholder
  return [
    { id: "v1", title: "흉부 CT", date: "2025-12-01", type: "CT" },
    { id: "v2", title: "복부 MRI", date: "2025-11-15", type: "MRI" },
  ];
}
