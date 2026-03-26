/**
 * Tool: issue_video
 *
 * 선택한 영상의 발급(다운로드 링크 생성)을 요청한다.
 *
 * TODO: 발급 요청 API 호출
 * TODO: 발급 상태 폴링 또는 웹훅 수신
 * TODO: 다운로드 URL 생성 & 만료 시간 설정
 * TODO: 발급 이력 저장
 */

export interface IssueVideoParams {
  videoId: string;
  patientId?: string;
  // TODO: 발급 형식 (CD, 온라인 뷰어, 다운로드 등)
}

export interface IssueVideoResult {
  issueId: string;
  status: "pending" | "ready" | "failed";
  downloadUrl?: string;
  expiresAt?: string;
}

export async function issueVideo(
  params: IssueVideoParams
): Promise<IssueVideoResult> {
  // TODO: 발급 API 호출
  console.log("[issueVideo] params:", params);

  // placeholder
  return {
    issueId: "issue-001",
    status: "pending",
  };
}
