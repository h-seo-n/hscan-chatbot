# HScan 챗봇 평가 기준 테스트 시나리오

## 기준 문서 및 코드 정렬 범위

이 문서는 `assesment_standards.pdf`의 평가 시나리오를 실제 코드에서 구현된 범위에 맞춰 정렬한 테스트 목록이다.

실제 테스트 스코프는 다음 코드 흐름을 기준으로 한다.

- LLM 시나리오 및 A2UI 출력 규칙: `src/core/llm/prompts.ts`
- MCP tool 실행 및 결과 store 반영: `src/core/orchestrator.ts`
- A2UI 렌더링 타입: `src/components/a2ui/A2UIRenderer.tsx`
- A2UI 액션 후속 처리: `src/components/a2ui/A2UIHandlers.ts`

## 공통 합격 기준

- 필요한 단계에서 텍스트 안내만 하지 않고 올바른 A2UI가 출력된다.
- 내 계정에 이미 가져온 영상은 `getImageList`를 사용한다.
- 아직 가져오지 않은 제휴 병원 영상은 `getImageByHospital`을 사용한다.
- `image-selector`, `hospital-image-selector`, `download-selector`가 목적에 맞게 구분된다.
- 시나리오 완료 후 사용자가 요청하지 않은 CD 발급, 병원 전송, 다운로드 흐름으로 자동 진입하지 않는다.
- 병원 두 곳이 나오는 경우 가져올 병원은 `issue-source`, 보낼 병원은 `send-destination`으로 구분된다.
- 결제, 동의, 주소 입력, 영상 선택 등 실제 진행 액션은 대응하는 A2UI를 포함한다.

## 테스트 시나리오 목록

| ID | 평가 항목 | 사용자 입력 예시 | 기대 결과 |
|---|---|---|---|
| T01 | 영상 목록 조회 | "내 영상 목록 보여줘" | `getImageList` 호출 후 `download-selector` 출력 |
| T02 | 영상 목록 조회 | "CT 영상만 보여줘" | modality 조건으로 조회하고, 텍스트 나열이 아닌 `download-selector` 출력 |
| T03 | 영상 목록 조회 | "2026년 3월에 찍은 영상 보여줘" | 날짜 조건 조회 후 목록 UI 출력 |
| T04 | 영상 목록 조회 | "서울대학교병원 흉부 CT 확인하고 싶어" | 병원, 부위, modality 조건에 맞는 목록 조회 |
| T05 | 영상 상세 조회 | "이 영상 상세 정보 보여줘" | 선택 영상의 `series` 기반 `detail-modal` 출력 |
| T06 | 빈 목록 처리 | 계정 영상이 없는 상태에서 "내 영상 보여줘" | `download-selector` 없이 "제휴 병원에서 가져오시겠어요?" 질문 |
| T07 | 영상 다운로드 | "내 영상 다운로드할래" | `download-selector` 출력 |
| T08 | 영상 다운로드 | UI에서 JPEG 선택 후 다운로드 | `downloadImage`가 JPEG 형식으로 호출되고 브라우저 다운로드 트리거 |
| T09 | 영상 다운로드 | "DICOM으로 받아줘" | UI 선택보다 채팅 명시 형식을 우선하여 `downloadImage` 호출 |
| T10 | 의사 공유 | "의사에게 내 영상 보여주고 싶어" | 첫 응답에 `question-form` 출력 |
| T11 | 의사 공유 | 질문 답변 후 진행 | `getImageList` 호출 후 `image-selector` 출력 |
| T12 | 의사 공유 | 영상 선택 완료 | `selected-images-list`와 `show-doctor-video-consent-form` 함께 출력 |
| T13 | 의사 공유 | 개인정보 동의 완료 | 6자리 `pincode` 출력, 동의 UI 반복 없음 |
| T14 | 병원 영상 가져오기 | "제휴 병원에 있는 영상 가져오고 싶어" | `hospital-selector` 출력, `purpose: issue-source` |
| T15 | 병원 영상 가져오기 | 병원 선택 완료 | `getImageByHospital(hospitalName)` 호출 후 `hospital-image-selector` 출력 |
| T16 | 병원 영상 가져오기 | 병원 영상 선택 완료 | 발급 결제 생성 후 `purchase-imaging` 출력 |
| T17 | 병원 영상 가져오기 | 결제 완료 | "영상 가져오기 완료" 안내만 출력, CD 자동 진행 금지 |
| T18 | CD 발급 | "내 영상을 CD로 받고 싶어" | `getImageList` 호출 후 `image-selector` 출력 |
| T19 | CD 발급 | 영상 선택 완료 | `address-contact-input` 출력 |
| T20 | CD 발급 | 주소/연락처 입력 완료 | CD 배송 결제 생성 후 `cd-purchase-card` 출력 |
| T21 | CD 발급 | CD 결제 완료 | 완료 안내만 출력, A2UI 반복 없음 |
| T22 | 병원에서 받아 CD | "서울병원 영상 받아서 바로 CD로 발급해줘" | `hospital-selector(issue-source)` -> `hospital-image-selector` -> `purchase-imaging` 순서로 진행 |
| T23 | 병원에서 받아 CD | 발급 결제 완료 | `address-contact-input`으로 이어짐 |
| T24 | 내 영상 보내기 | "내 영상을 다른 병원으로 보내줘" | `hospital-selector` 출력, `purpose: send-destination` |
| T25 | 내 영상 보내기 | 목적지 병원 선택 완료 | `getImageList` 호출 후 `image-selector` 출력 |
| T26 | 내 영상 보내기 | 영상 선택 완료 | `selected-images-list`와 `send-image-consent-form` 함께 출력 |
| T27 | 내 영상 보내기 | 전송 동의 완료 | 전송 완료 안내만 출력 |
| T28 | 받아서 바로 보내기 | "컴퓨터의원 영상 받아서 서울병원으로 보내줘" | 컴퓨터의원은 source, 서울병원은 destination으로 구분 |
| T29 | 받아서 바로 보내기 | source 병원 선택 후 영상 선택 | destination 병원에 대해 `getImageByHospital` 재호출 금지 |
| T30 | 받아서 바로 보내기 | 결제 화면 | `purchase-imaging`에 `sourceHospitalName`, `destinationHospitalName` 모두 반영 |
| T31 | 혼합 컨텍스트 | 먼저 "내 영상 목록", 다음 "서울병원에서 영상 가져와줘" | 이전 목록 조회 컨텍스트에 끌려가지 않고 병원 가져오기 흐름 진행 |
| T32 | 혼합 컨텍스트 | CD 발급 중 "찾는 영상이 없어" | 배송지 입력으로 넘어가지 않고 병원에서 가져올지 텍스트 질문 |
| T33 | 모호한 의도 | "서울병원에서 찍은 영상 보고 싶어" | 이미 가져온 영상인지, 병원에만 있는 영상인지 clarification 질문 |

## 평가 기준별 권장 테스트 수량

평가표의 통과율 기준을 맞추려면 위 기본 시나리오를 다음 방식으로 변형해 테스트 수량을 채우는 것이 적절하다.

| 평가 기준 | 코드상 대응 범위 | 권장 변형 |
|---|---|---|
| 영상 목록 조회 20개 중 16개 성공 | 시나리오7, `getImageList`, `download-selector`, `detail-modal` | 병원명, 날짜, modality, 부위, 다중 조건, 빈 결과 |
| 영상 다운로드 3개 중 3개 성공 | 시나리오7, `downloadImage` | JPEG, DICOM, 다중 영상 다운로드 |
| 영상 가져오기 20개 중 16개 성공 | 시나리오3, `hospital-selector(issue-source)`, `getImageByHospital`, `hospital-image-selector`, `purchase-imaging` | 병원명 직접 입력, 병원 선택 UI, 날짜 조건, modality 조건, 다중 영상 |
| 영상 보내기 - 받아서 바로 보내기 5개 중 4개 성공 | 시나리오6 | source/destination 병원 명시, source만 먼저 선택, destination 나중 선택, 다중 영상 |
| 영상 보내기 - 이미 받아놓은 영상 보내기 5개 중 4개 성공 | 시나리오5 | 목적지 병원 선택, 영상 선택, 전송 동의, 빈 목록 |
| 비제휴 병원 의사에게 보여주기 5개 중 4개 성공 | 시나리오1 | 질문폼 경유, 부위 기반 선택, 병원명 기반 선택, 다중 영상, 코드 재생성 |
| CD 발급 - 이미 받아놓은 영상 5개 중 4개 성공 | 시나리오2 | 단일/다중 영상, 주소 입력, 결제 성공, 찾는 영상 없음 |
| CD 발급 - 받아서 바로 CD 5개 중 4개 성공 | 시나리오4 | 병원 선택, 병원 영상 선택, 발급 결제, 배송지 입력, CD 결제 |
| 혼합 테스트 5개 중 4개 성공 | 시나리오 간 컨텍스트 전환 | 목록 조회 후 가져오기, CD 중 not-found, 보내기 후 의사 공유, 가져오기 후 CD 자동 진입 금지, source/destination 혼동 방지 |

## 코드 범위 밖으로 보는 항목

다음 항목은 평가 관점에서는 중요하지만 현재 프론트 코드가 직접 검증하는 범위가 아니다.

- 실제 DICOM 뷰어의 영상 품질, 확대/측정/윈도우링 기능
- 병원 API 내부 정산, 실제 결제 승인사 연동 세부 검증
- 실제 병원 EMR/PACS의 원본 데이터 정확성
- 비제휴 의사 공유 코드가 서버에서 실제 검증되는 전체 백엔드 흐름
- MCP 서버의 도구 구현 자체 품질. 이 프론트 테스트에서는 tool 호출 이름, 인자, 결과 반영까지만 확인한다.

## 우선순위 높은 리스크

- 내 계정 영상과 병원 미발급 영상을 혼동하여 `getImageList`와 `getImageByHospital`을 잘못 호출하는 문제
- `image-selector`와 `hospital-image-selector`가 잘못 출력되는 문제
- 받아서 바로 보내기에서 source 병원과 destination 병원이 뒤바뀌는 문제
- 시나리오 완료 후 사용자가 요청하지 않은 CD 발급이나 병원 전송 UI가 자동으로 출력되는 문제
- 목록 조회 요청에서 텍스트 나열만 하고 `download-selector`를 출력하지 않는 문제
