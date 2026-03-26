import Header from "./Header";
import ActionCard from "./ActionCard";
import ChatInput from "./ChatInput";
import MessageBubble, { MessageLoading } from "./MessageBubble";

import DoctorIcon from "../../assets/doctor.svg";
import CdDeliveryIcon from "../../assets/cd.svg";
import HospitalReceiveIcon from "../../assets/hospital.svg";
import HospitalSendIcon from "../../assets/register.svg";

import styles from "./Home.module.css";
import { useChatStore } from "../../core/util/chatStore";
import { useEffect, useRef } from "react";

interface ActionItem {
  id: string;
  iconUrl: string;
  label: string;
}

const ACTION_ITEMS: ActionItem[] = [
  { id: "show-doctor", iconUrl: DoctorIcon, label: "내 영상 의사에게 보여주기" },
  { id: "cd-delivery", iconUrl: CdDeliveryIcon, label: "내 영상 CD로 배송받기" },
  { id: "receive-hospital", iconUrl: HospitalReceiveIcon, label: "내 영상 병원에서 받기" },
  { id: "send-hospital", iconUrl: HospitalSendIcon, label: "내 영상 병원으로 보내기" },
];

/**
 * 메인 채팅 윈도우 컴포넌트
 *
 * TODO: 메시지 무한 스크롤 (오래된 메시지 lazy load)
 * TODO: 새 메시지 도착 시 자동 스크롤
 * TODO: 타이핑 인디케이터
 * TODO: 연결 상태 표시 (MCP 서버 연결 여부)
 */
interface HomePageProps {
    handleSendMessage: (text: string) => void;
    handleA2UIAction: (action: string, payload: unknown) => void;
}

const HomePage = ({ handleSendMessage, handleA2UIAction }: HomePageProps) => {
    const messages = useChatStore((s) => s.messages);
    const isLoading = useChatStore((s) => s.isLoading);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 새 메시지 추가 시 하단 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleActionClick = (id: string) => {
        console.log(`Action clicked: ${id}`);
    };

    return (
    <div className={styles.pageContainer}>
        {/** TODO : Login 클릭 시 Login 모달 나오도록 */}
        <Header onLoginClick={() => console.log("Login clicked")} />


        {/** 메시지 X인 처음 상태 */}
        {messages.length === 0 && (
        <main
            className={styles.mainWrapper}
        >
            <section className={styles.textSection}>
                <h1 className={styles.headerText}>
                    안녕하세요,
                    <br />
                    오늘은 무엇을 하고 싶으신가요?
                </h1>
            </section>

            <section className={styles.actionSection}>
            {ACTION_ITEMS.map((item) => (
                <ActionCard
                key={item.id}
                iconUrl={item.iconUrl}
                label={item.label}
                onClick={() => handleActionClick(item.id)}
                />
            ))}
            </section>
        </main>
        )}
        {/** 메시지 내역 */}
        {messages.map((msg) => (
            <MessageBubble
                key={msg.id}
                message={msg}
                onA2UIAction={handleA2UIAction}
            />
        ))}
        {/** 로딩 indicator */}
        {isLoading && (
            <MessageLoading />
        )}

        <footer className={styles.chatFooter} ref={bottomRef}>
            <ChatInput onSubmit={handleSendMessage} />
        </footer>
    </div>
    );
};

export default HomePage;