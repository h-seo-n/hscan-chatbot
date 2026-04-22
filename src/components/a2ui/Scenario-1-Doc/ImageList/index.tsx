import { useMemo, useState } from "react";
import type { Case } from "../../../../core/util/types/caseTypes";
import styles from "./ImageList.module.css";

interface ImageListProps {
  cases?: Case[];
  submitLabel?: string;
  onSelect?: (imageIds: string[]) => void;
  onNotFound?: () => void;
}

// TODO : get case from healthhub api
const fallbackCases: Case[] = [
        {
            "caseId": "69d288762c6323244166458e",
            "patientId": "snucse-000",
            "birthDate": "20040403",
            "patientName": "허^서연",
            "patientSex": "F",
            "studyDate": "20260320",
            "accessionNumber": null,
            "studyInstanceUID": "2.25.327131602022764103321340949799553493109",
            "studyDescription": "Knee (R)",
            "modality": "MR",
            "institutionName": "",
            "imageHash": {},
            "bodyPart": [
                ""
            ],
            "series": [
                {
                    "seriesNumber": "0",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111201370.72665630.67534267",
                    "seriesDescription": "Loc (Right)",
                    "images": [
                        "69d28879de217b523f4b191f",
                        "69d28876533241e6a7a88b19",
                        "69d2887b2c632324416645a3",
                        "69d2887c2c632324416645ad",
                        "69d28876533241e6a7a88b1c",
                        "69d2887d2c632324416645b7",
                        "69d28876533241e6a7a88b1b",
                        "69d28877533241e6a7a88b20",
                        "69d288772c63232441664590",
                        "69d288772c63232441664591",
                        "69d2887c2c632324416645aa",
                        "69d28876533241e6a7a88b1e",
                        "69d28879de217b523f4b1921",
                        "69d288782c63232441664592",
                        "69d28878de217b523f4b191e",
                        "69d288762c6323244166458f",
                        "69d28877533241e6a7a88b21",
                        "69d2887ade217b523f4b1924",
                        "69d2887bde217b523f4b1936",
                        "69d288792c63232441664595",
                        "69d2887a2c6323244166459c",
                        "69d28876533241e6a7a88b1a",
                        "69d28877533241e6a7a88b1f",
                        "69d28878533241e6a7a88b32",
                        "69d28876533241e6a7a88b1d",
                        "69d28878de217b523f4b191c",
                        "69d28878de217b523f4b191d"
                    ]
                },
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111204584.92619625.78204558",
                    "seriesDescription": "Sag FRSE PD FS",
                    "images": [
                        "69d288792c63232441664593",
                        "69d2887bde217b523f4b1937",
                        "69d288792c63232441664596",
                        "69d2887c2c632324416645b0",
                        "69d2887ade217b523f4b192e",
                        "69d2887c2c632324416645ab",
                        "69d2887bde217b523f4b1933",
                        "69d2887b2c632324416645a0",
                        "69d2887ade217b523f4b192c",
                        "69d2887bde217b523f4b1939",
                        "69d2887b2c6323244166459f",
                        "69d28879533241e6a7a88b3c",
                        "69d2887b2c632324416645a1",
                        "69d2887e2c632324416645c5",
                        "69d2887b2c632324416645a2",
                        "69d2887d2c632324416645b3",
                        "69d2887e2c632324416645c3",
                        "69d28878533241e6a7a88b30",
                        "69d288792c63232441664594",
                        "69d2887cde217b523f4b193d",
                        "69d2887cde217b523f4b1943",
                        "69d2887cde217b523f4b193f"
                    ]
                },
                {
                    "seriesNumber": "2",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111153403.39691445.89792679",
                    "seriesDescription": "Cor FSE PD",
                    "images": [
                        "69d2887ade217b523f4b192b",
                        "69d2887c2c632324416645a5",
                        "69d2887bde217b523f4b1938",
                        "69d2887d2c632324416645b2",
                        "69d2887bde217b523f4b1934",
                        "69d2887c2c632324416645a6",
                        "69d28878533241e6a7a88b35",
                        "69d2887d2c632324416645b9",
                        "69d2887bde217b523f4b1931",
                        "69d28878533241e6a7a88b2a",
                        "69d28878533241e6a7a88b2f",
                        "69d28877533241e6a7a88b24",
                        "69d2887cde217b523f4b1940",
                        "69d28878533241e6a7a88b34",
                        "69d2887bde217b523f4b192f",
                        "69d2887c2c632324416645ae",
                        "69d2887ade217b523f4b1929",
                        "69d28878533241e6a7a88b33",
                        "69d2887ade217b523f4b1928",
                        "69d2887d2c632324416645b8"
                    ]
                },
                {
                    "seriesNumber": "3",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111148288.94019146.71622702",
                    "seriesDescription": "AX.  FSE PD",
                    "images": [
                        "69d2887ade217b523f4b1926",
                        "69d2887d2c632324416645b1",
                        "69d2887a2c63232441664597",
                        "69d2887bde217b523f4b1935",
                        "69d2887bde217b523f4b1930",
                        "69d2887a2c63232441664598",
                        "69d2887c2c632324416645a9",
                        "69d28879de217b523f4b1922",
                        "69d2887d2c632324416645bb",
                        "69d28878533241e6a7a88b2e",
                        "69d28877533241e6a7a88b26",
                        "69d2887e2c632324416645c4",
                        "69d28879533241e6a7a88b39",
                        "69d2887bde217b523f4b193c",
                        "69d2887ade217b523f4b1925",
                        "69d28878533241e6a7a88b2c",
                        "69d28877533241e6a7a88b22",
                        "69d28879de217b523f4b1923",
                        "69d28877533241e6a7a88b23",
                        "69d28877533241e6a7a88b25",
                        "69d2887e2c632324416645c1",
                        "69d28879de217b523f4b1920",
                        "69d2887bde217b523f4b1932",
                        "69d2887e2c632324416645c0"
                    ]
                },
                {
                    "seriesNumber": "4",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111208937.49685336.24517034",
                    "seriesDescription": "Sag FSE T2",
                    "images": [
                        "69d2887c2c632324416645ac",
                        "69d2887ade217b523f4b192a",
                        "69d28879533241e6a7a88b3b",
                        "69d2887e2c632324416645c2",
                        "69d2887cde217b523f4b1941",
                        "69d28878533241e6a7a88b31",
                        "69d2887ade217b523f4b1927",
                        "69d2887c2c632324416645af",
                        "69d28879533241e6a7a88b37",
                        "69d2887d2c632324416645b4",
                        "69d28878533241e6a7a88b29",
                        "69d2887a2c63232441664599",
                        "69d2887d2c632324416645bd",
                        "69d28879533241e6a7a88b3d",
                        "69d2887b2c6323244166459d",
                        "69d2887a2c6323244166459a",
                        "69d2887a2c6323244166459b",
                        "69d2887d2c632324416645b5",
                        "69d2887c2c632324416645a8",
                        "69d2887b2c632324416645a4",
                        "69d28879533241e6a7a88b3f",
                        "69d2887c2c632324416645a7"
                    ]
                },
                {
                    "seriesNumber": "5",
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103111157341.71737845.59538788",
                    "seriesDescription": "Cor FSE T1",
                    "images": [
                        "69d28878533241e6a7a88b36",
                        "69d2887cde217b523f4b1942",
                        "69d2887d2c632324416645ba",
                        "69d28879533241e6a7a88b40",
                        "69d28878533241e6a7a88b2d",
                        "69d2887d2c632324416645bc",
                        "69d2887e2c632324416645be",
                        "69d28879533241e6a7a88b38",
                        "69d28878533241e6a7a88b2b",
                        "69d2887bde217b523f4b193b",
                        "69d2887cde217b523f4b193e",
                        "69d2887bde217b523f4b193a",
                        "69d2887e2c632324416645bf",
                        "69d2887b2c6323244166459e",
                        "69d2887d2c632324416645b6",
                        "69d28879533241e6a7a88b3e",
                        "69d28877533241e6a7a88b27",
                        "69d2887ade217b523f4b192d",
                        "69d28879533241e6a7a88b3a",
                        "69d28878533241e6a7a88b28"
                    ]
                }
            ],
            "createdAt": null,
            "userId": "06445f5c-9a66-41e4-8020-f72d8d5d48ed",
            "requestedDate": "2026-04-05T16:06:03.892Z",
            "acceptedDate": "2026-04-05T16:06:22.493Z",
            "locked": false,
            "contentIds": [
                "69d28879de217b523f4b191f",
                "69d28876533241e6a7a88b19",
                "69d2887b2c632324416645a3",
                "69d2887c2c632324416645ad",
                "69d28876533241e6a7a88b1c",
                "69d2887d2c632324416645b7",
                "69d28876533241e6a7a88b1b",
                "69d28877533241e6a7a88b20",
                "69d288772c63232441664590",
                "69d288772c63232441664591",
                "69d2887c2c632324416645aa",
                "69d28876533241e6a7a88b1e",
                "69d28879de217b523f4b1921",
                "69d288782c63232441664592",
                "69d28878de217b523f4b191e",
                "69d288762c6323244166458f",
                "69d28877533241e6a7a88b21",
                "69d2887ade217b523f4b1924",
                "69d2887bde217b523f4b1936",
                "69d288792c63232441664595",
                "69d2887a2c6323244166459c",
                "69d28876533241e6a7a88b1a",
                "69d28877533241e6a7a88b1f",
                "69d28878533241e6a7a88b32",
                "69d28876533241e6a7a88b1d",
                "69d28878de217b523f4b191c",
                "69d28878de217b523f4b191d",
                "69d288792c63232441664593",
                "69d2887bde217b523f4b1937",
                "69d288792c63232441664596",
                "69d2887c2c632324416645b0",
                "69d2887ade217b523f4b192e",
                "69d2887c2c632324416645ab",
                "69d2887bde217b523f4b1933",
                "69d2887b2c632324416645a0",
                "69d2887ade217b523f4b192c",
                "69d2887bde217b523f4b1939",
                "69d2887b2c6323244166459f",
                "69d28879533241e6a7a88b3c",
                "69d2887b2c632324416645a1",
                "69d2887e2c632324416645c5",
                "69d2887b2c632324416645a2",
                "69d2887d2c632324416645b3",
                "69d2887e2c632324416645c3",
                "69d28878533241e6a7a88b30",
                "69d288792c63232441664594",
                "69d2887cde217b523f4b193d",
                "69d2887cde217b523f4b1943",
                "69d2887cde217b523f4b193f",
                "69d2887ade217b523f4b192b",
                "69d2887c2c632324416645a5",
                "69d2887bde217b523f4b1938",
                "69d2887d2c632324416645b2",
                "69d2887bde217b523f4b1934",
                "69d2887c2c632324416645a6",
                "69d28878533241e6a7a88b35",
                "69d2887d2c632324416645b9",
                "69d2887bde217b523f4b1931",
                "69d28878533241e6a7a88b2a",
                "69d28878533241e6a7a88b2f",
                "69d28877533241e6a7a88b24",
                "69d2887cde217b523f4b1940",
                "69d28878533241e6a7a88b34",
                "69d2887bde217b523f4b192f",
                "69d2887c2c632324416645ae",
                "69d2887ade217b523f4b1929",
                "69d28878533241e6a7a88b33",
                "69d2887ade217b523f4b1928",
                "69d2887d2c632324416645b8",
                "69d2887ade217b523f4b1926",
                "69d2887d2c632324416645b1",
                "69d2887a2c63232441664597",
                "69d2887bde217b523f4b1935",
                "69d2887bde217b523f4b1930",
                "69d2887a2c63232441664598",
                "69d2887c2c632324416645a9",
                "69d28879de217b523f4b1922",
                "69d2887d2c632324416645bb",
                "69d28878533241e6a7a88b2e",
                "69d28877533241e6a7a88b26",
                "69d2887e2c632324416645c4",
                "69d28879533241e6a7a88b39",
                "69d2887bde217b523f4b193c",
                "69d2887ade217b523f4b1925",
                "69d28878533241e6a7a88b2c",
                "69d28877533241e6a7a88b22",
                "69d28879de217b523f4b1923",
                "69d28877533241e6a7a88b23",
                "69d28877533241e6a7a88b25",
                "69d2887e2c632324416645c1",
                "69d28879de217b523f4b1920",
                "69d2887bde217b523f4b1932",
                "69d2887e2c632324416645c0",
                "69d2887c2c632324416645ac",
                "69d2887ade217b523f4b192a",
                "69d28879533241e6a7a88b3b",
                "69d2887e2c632324416645c2",
                "69d2887cde217b523f4b1941",
                "69d28878533241e6a7a88b31",
                "69d2887ade217b523f4b1927",
                "69d2887c2c632324416645af",
                "69d28879533241e6a7a88b37",
                "69d2887d2c632324416645b4",
                "69d28878533241e6a7a88b29",
                "69d2887a2c63232441664599",
                "69d2887d2c632324416645bd",
                "69d28879533241e6a7a88b3d",
                "69d2887b2c6323244166459d",
                "69d2887a2c6323244166459a",
                "69d2887a2c6323244166459b",
                "69d2887d2c632324416645b5",
                "69d2887c2c632324416645a8",
                "69d2887b2c632324416645a4",
                "69d28879533241e6a7a88b3f",
                "69d2887c2c632324416645a7",
                "69d28878533241e6a7a88b36",
                "69d2887cde217b523f4b1942",
                "69d2887d2c632324416645ba",
                "69d28879533241e6a7a88b40",
                "69d28878533241e6a7a88b2d",
                "69d2887d2c632324416645bc",
                "69d2887e2c632324416645be",
                "69d28879533241e6a7a88b38",
                "69d28878533241e6a7a88b2b",
                "69d2887bde217b523f4b193b",
                "69d2887cde217b523f4b193e",
                "69d2887bde217b523f4b193a",
                "69d2887e2c632324416645bf",
                "69d2887b2c6323244166459e",
                "69d2887d2c632324416645b6",
                "69d28879533241e6a7a88b3e",
                "69d28877533241e6a7a88b27",
                "69d2887ade217b523f4b192d",
                "69d28879533241e6a7a88b3a",
                "69d28878533241e6a7a88b28"
            ]
        },
        {
            "caseId": "69d0a819de217b523f4a6d20",
            "patientId": "snucse-000",
            "birthDate": "20040403",
            "patientName": "허^서연",
            "patientSex": "F",
            "studyDate": "20260315",
            "accessionNumber": null,
            "studyInstanceUID": "2.25.284893921871911622217362124371987655993",
            "studyDescription": "",
            "modality": "OP",
            "institutionName": "",
            "imageHash": {},
            "bodyPart": [
                ""
            ],
            "series": [
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.202309138393087.3163919097679107908431",
                    "seriesDescription": "RASTER_21_LINES",
                    "images": [
                        "69d0a819de217b523f4a6d21"
                    ]
                },
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.2023091383923657.444908636919150843077",
                    "seriesDescription": "Macular Cube 512x128",
                    "images": [
                        "69d0a81ade217b523f4a6d24"
                    ]
                },
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.2023091383924475.541159942271075703100",
                    "seriesDescription": "RASTER_21_LINES",
                    "images": [
                        "69d0a81fde217b523f4a6d25"
                    ]
                },
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.202309138392764.8484855204698528896849",
                    "seriesDescription": "Macular Cube 512x128",
                    "images": [
                        "69d0a826de217b523f4a6d3b"
                    ]
                }
            ],
            "createdAt": null,
            "userId": "06445f5c-9a66-41e4-8020-f72d8d5d48ed",
            "requestedDate": "2026-04-04T05:56:34.079Z",
            "acceptedDate": "2026-04-04T05:56:55.131Z",
            "locked": false,
            "contentIds": [
                "69d0a819de217b523f4a6d21",
                "69d0a81ade217b523f4a6d24",
                "69d0a81fde217b523f4a6d25",
                "69d0a826de217b523f4a6d3b"
            ]
        },
        {
            "caseId": "69d0a8322c6323244165a7d1",
            "patientId": "snucse-000",
            "birthDate": "20040403",
            "patientName": "허^서연",
            "patientSex": "F",
            "studyDate": "20260316",
            "accessionNumber": null,
            "studyInstanceUID": "2.25.116508088413050350438550453692458756533",
            "studyDescription": "",
            "modality": "OT",
            "institutionName": "",
            "imageHash": {},
            "bodyPart": [
                ""
            ],
            "series": [
                {
                    "seriesNumber": null,
                    "seriesInstanceUID": "1.2.826.0.1.3680043.8.1055.1.20111103112244831.29109107.29203688",
                    "seriesDescription": null,
                    "images": [
                        "69d0a8322c6323244165a7d2"
                    ]
                }
            ],
            "createdAt": null,
            "userId": "06445f5c-9a66-41e4-8020-f72d8d5d48ed",
            "requestedDate": "2026-04-04T05:56:34.055Z",
            "acceptedDate": "2026-04-04T05:57:06.638Z",
            "locked": false,
            "contentIds": [
                "69d0a8322c6323244165a7d2"
            ]
        },
        {
            "caseId": "69d0a853533241e6a7a88b07",
            "patientId": "snucse-000",
            "birthDate": "20040403",
            "patientName": "허^서연",
            "patientSex": "F",
            "studyDate": "20260317",
            "accessionNumber": null,
            "studyInstanceUID": "2.25.110208270766533696770992016978041239197",
            "studyDescription": "",
            "modality": "PX",
            "institutionName": "",
            "imageHash": {},
            "bodyPart": [
                "JAW"
            ],
            "series": [
                {
                    "seriesNumber": null,
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.2023091384336494.575117162211064181910",
                    "seriesDescription": null,
                    "images": [
                        "69d0a853533241e6a7a88b08"
                    ]
                }
            ],
            "createdAt": null,
            "userId": "06445f5c-9a66-41e4-8020-f72d8d5d48ed",
            "requestedDate": "2026-04-04T05:56:34.051Z",
            "acceptedDate": "2026-04-04T05:57:39.397Z",
            "locked": false,
            "contentIds": [
                "69d0a853533241e6a7a88b08"
            ]
        },
        {
            "caseId": "69d0a870de217b523f4a6df0",
            "patientId": "snucse-000",
            "birthDate": "20040403",
            "patientName": "허^서연",
            "patientSex": "F",
            "studyDate": "20260319",
            "accessionNumber": null,
            "studyInstanceUID": "2.25.206379916041649808524765796058104165150",
            "studyDescription": "",
            "modality": "XC",
            "institutionName": "",
            "imageHash": {},
            "bodyPart": [
                ""
            ],
            "series": [
                {
                    "seriesNumber": "1",
                    "seriesInstanceUID": "1.3.6.1.4.1.44316.6.102.2.202309138320808.3567162211774798649658",
                    "seriesDescription": null,
                    "images": [
                        "69d0a870de217b523f4a6df1",
                        "69d0a870de217b523f4a6df2",
                        "69d0a870de217b523f4a6df3",
                        "69d0a870de217b523f4a6df4"
                    ]
                }
            ],
            "createdAt": null,
            "userId": "06445f5c-9a66-41e4-8020-f72d8d5d48ed",
            "requestedDate": "2026-04-04T05:56:34.037Z",
            "acceptedDate": "2026-04-04T05:58:08.392Z",
            "locked": false,
            "contentIds": [
                "69d0a870de217b523f4a6df1",
                "69d0a870de217b523f4a6df2",
                "69d0a870de217b523f4a6df3",
                "69d0a870de217b523f4a6df4"
            ]
        }
  ];

export default function ImageList({
  cases = [],
  submitLabel,
  onSelect,
  onNotFound,
}: ImageListProps) {
  const items = useMemo(
    () => (cases.length > 0 ? cases : fallbackCases),
    [cases],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const buttonLabel = submitLabel ?? `${selectedCount}건 선택하기`;

  const handleSelect = (imageId: string) => {
    setSelectedIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId],
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      return;
    }

    onSelect?.(selectedIds);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.list}>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <button
                aria-pressed={isSelected}
                className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                key={item.id}
                onClick={() => handleSelect(item.id)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}
                >
                  {isSelected && <span className={styles.checkmark} />}
                </span>

                <span className={styles.thumbnail}>
                  {item.thumbnailUrl ? (
                    <img
                      alt={`${item.title} 썸네일`}
                      src={item.thumbnailUrl}
                    />
                  ) : (
                    <span className={styles.thumbnailLabel}>영상 이미지</span>
                  )}
                </span>

                <span className={styles.details}>
                  <span className={styles.titleRow}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.hospital}>{item.hospital}</span>
                  </span>
                  <span className={styles.metaRow}>
                    <span className={styles.meta}>{item.bodyPart}</span>
                    <span className={styles.separator}>|</span>
                    <span className={styles.meta}>{item.modality}</span>
                  </span>
                  <span className={styles.date}>{item.capturedAt}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          className={styles.submitButton}
          disabled={selectedIds.length === 0}
          onClick={handleSubmit}
          type="button"
        >
          {buttonLabel}
        </button>
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
