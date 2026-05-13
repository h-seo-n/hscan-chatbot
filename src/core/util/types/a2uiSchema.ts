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

const SendImageConsentFormBlock = z.object({
    type: z.literal("send-image-consent-form"),
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

const PriceValueSchema = z.union([z.number(), z.string()]);

const HospitalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
}).strict();

const SeriesSchema = z.object({
  seriesNumber: z.string().nullable().default(null),
  seriesInstanceUID: z.string().min(1),
  seriesDescription: z.string().nullable().default(null),
  images: z.array(z.string()).default([]),
}).strict();

const CaseSchema = z.object({
  caseId: z.string().min(1),
  patientId: z.string().default(""),
  birthDate: z.string().default(""),
  patientName: z.string().default(""),
  patientSex: z.enum(["M", "F", "O"]).default("O"),
  studyDate: z.string().default(""),
  accessionNumber: z.string().nullable().default(null),
  studyInstanceUID: z.string().default(""),
  studyDescription: z.string().default("영상 이름"),
  modality: z.string().default(""),
  institutionName: z.string().default(""),
  imageHash: z.record(z.string(), z.unknown()).default({}),
  bodyPart: z.array(z.string()).default([]),
  series: z.array(SeriesSchema).default([]),
  createdAt: z.string().nullable().default(null),
  userId: z.string().default(""),
  requestedDate: z.string().default(""),
  acceptedDate: z.string().default(""),
  locked: z.boolean().default(false),
  contentIds: z.array(z.string()).default([]),
}).strict();

/* Scenario #2 - CD 등기우편 발송 */
const AddressContactInputBlock = z.object({
  type: z.literal("address-contact-input"),
  props: z.object({
    initialValues: z.object({
      address: z.string().optional(),
      addressDetail: z.string().optional(),
      name: z.string().optional(),
      tel: z.string().optional(),
    }).strict().optional(),
  }).strict(),
});

const MedicalConsentFormBlock = z.object({
  type: z.literal("medical-consent-form"),
  props: EmptyProps,
});

const DeliveryInfoCardBlock = z.object({
  type: z.literal("delivery-info-card"),
  props: z.object({
    address: z.string().optional(),
    addressDetail: z.string().optional(),
    name: z.string().optional(),
    tel: z.string().optional(),
    registeredMailCost: PriceValueSchema.optional(),
  }).strict(),
});

const CdPurchaseCardBlock = z.object({
  type: z.literal("cd-purchase-card"),
  props: z.object({
    address: z.string().optional(),
    addressDetail: z.string().optional(),
    name: z.string().optional(),
    tel: z.string().optional(),
    registeredMailCost: PriceValueSchema.optional(),
  }).strict(),
});

/* Scenario #3 - 제휴 병원으로 영상 보내기 */
const HospitalSelectorBlock = z.object({
  type: z.literal("hospital-selector"),
  props: z.object({
    hospitals: z.array(HospitalSchema).optional(),
  }).strict(),
});

const PurchaseImagingBlock = z.object({
  type: z.literal("purchase-imaging"),
  props: z.object({
    hospitalName: z.string().optional(),
    selectedVideoCount: PriceValueSchema.optional(),
    issueCost: PriceValueSchema.optional(),
    agencyFee: PriceValueSchema.optional(),
    vat: PriceValueSchema.optional(),
  }).strict(),
});

const PurchaseTableBlock = z.object({
  type: z.literal("purchase-table"),
  props: z.object({
    selectedVideoCount: PriceValueSchema,
    issueCost: PriceValueSchema,
    agencyFee: PriceValueSchema,
    vat: PriceValueSchema,
  }).strict(),
});

/* Scenario #7 - 영상 목록 조회, 다운로드 */

const DownloadSelectorBlock = z.object({
  type: z.literal("download-selector"),
  props: z.object({
    cases: z.array(CaseSchema).optional(),
    submitLabel: z.string().optional(),
  }).strict(),
});

const DetailModalBlock = z.object({
  type: z.literal("detail-modal"),
  props: z.object({
    series: z.array(SeriesSchema).optional(),
  }).strict(),
});


/** ---- 최상위 discriminated union (or "|") schema ------------------------------------ */
export const A2UIBlockSchema = z.discriminatedUnion("type", [
  // Scenario #1
  ShowDoctorVideoConsentFormBlock,
  SendImageConsentFormBlock,
  ImageSelectorBlock,
  SelectedImagesListBlock,
  PincodeBlock,
  QuestionFormBlock,
  // Scenario #2
  AddressContactInputBlock,
  MedicalConsentFormBlock,
  DeliveryInfoCardBlock,
  CdPurchaseCardBlock,
  // Scenario #3
  HospitalSelectorBlock,
  PurchaseImagingBlock,
  PurchaseTableBlock,
  // Scenario #7
  DownloadSelectorBlock,
  DetailModalBlock,
]);


/** ---------- 파생된 A2UI 관련 types ---------- */
export type A2UIBlock = z.infer<typeof A2UIBlockSchema>;
export type A2UIType = A2UIBlock["type"];

// 개별 블록 타입
export type PincodeBlockType = z.infer<typeof PincodeBlock>;
export type QuestionFormBlockType = z.infer<typeof QuestionFormBlock>;
