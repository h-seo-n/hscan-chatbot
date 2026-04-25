import { z } from "zod";

// prop이 없는 A2UI 블록 : 빈 객체만 허용
const EmptyProps = z.object({}).strict();

// Question-form question schema
export const QuestionSchema = z.object({
  question: z.string().min(1),
  hasInput: z.boolean(),
  placeholder: z.string().optional(),
});

/* ---------- 시나리오별 블록 스키마 ---------- */

/* Scenario #1 - 제휴 아닌 병원 의사에게 영상 보여주기 */
const ShowDoctorVideoConsentFormBlock = z.object({
    type: z.literal("show-doctor-video-consent-form"),
    props: EmptyProps,
});

const ImageSelectorBlock = z.object({
    type: z.literal("image-selector"),
    props: EmptyProps,
});

const SelectedImagesListBlock = z.object({
    type: z.literal("selected-images-list"),
    props: EmptyProps,
});

const PincodeBlock = z.object({
    type: z.literal("pincode"),
    props: z.object({
        code: z.string().length(6),
    }).strict(),
});

const QuestionFormBlock = z.object({
    type: z.literal("question-form"),
    props: z.object({
        questions: z.array(QuestionSchema).min(1),
    }).strict(),
})

/* Scenario #2 - 이미 있는 영상 등록 (TODO: props 확정 후 채우기) */
// prop -> schema -> renderer case 순서대로 작업!
const AddressContactInputBlock = z.object({
  type: z.literal("address-contact-input"),
  props: z.record(z.string(), z.unknown()),  // placeholder
});

const MedicalConsentFormBlock = z.object({
  type: z.literal("medical-consent-form"),
  props: z.record(z.string(), z.unknown()),
});

const DeliveryInfoCardBlock = z.object({
  type: z.literal("delivery-info-card"),
  props: z.record(z.string(), z.unknown()),
});

const CdPurchaseCardBlock = z.object({
  type: z.literal("cd-purchase-card"),
  props: z.record(z.string(), z.unknown()),
});

/* Scenario #7 - 영상 목록 조회, 다운로드 (TODO) */

const DownloadSelectorBlock = z.object({
  type: z.literal("download-selector"),
  props: z.record(z.string(), z.unknown()),
});


/** ---- 최상위 discriminated union (or "|") schema ------------------------------------ */
export const A2UIBlockSchema = z.discriminatedUnion("type", [
  // Scenario #1
  ShowDoctorVideoConsentFormBlock,
  ImageSelectorBlock,
  SelectedImagesListBlock,
  PincodeBlock,
  QuestionFormBlock,
  // Scenario #2
  AddressContactInputBlock,
  MedicalConsentFormBlock,
  DeliveryInfoCardBlock,
  CdPurchaseCardBlock,
  // Scenario #7
  DownloadSelectorBlock,
]);


/** ---------- 파생된 A2UI 관련 types ---------- */
export type A2UIBlock = z.infer<typeof A2UIBlockSchema>;
export type A2UIType = A2UIBlock["type"];

// 개별 블록 타입
export type PincodeBlockType = z.infer<typeof PincodeBlock>;
export type QuestionFormBlockType = z.infer<typeof QuestionFormBlock>;
