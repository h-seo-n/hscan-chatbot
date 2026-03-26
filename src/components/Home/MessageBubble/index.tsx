import type { ChatMessage } from "../../../core/util/types";
import A2UIRenderer from "../../a2ui/A2UIRenderer";
import styles from "./MessageBubble.module.css";

interface MessageBubbleProps {
  message: ChatMessage;
  /** A2UI 사용자 인터랙션 콜백 */
  onA2UIAction?: (action: string, payload: unknown) => void;
}

/**
 * 개별 말풍선 컴포넌트
 *
 * TODO: 마크다운 렌더링 지원
 * TODO: 코드 블록 하이라이팅
 * TODO: 메시지 시간 표시
 * TODO: 로딩 인디케이터 (assistant 응답 대기 중)
 */

export const MessageLoading = () => {
  return (
          <div className={`${styles.messageBubble} ${styles.assistant}`}>
            <span className={styles.typingIndicator}>
              <span />
              <span />
              <span />
            </span>
          </div>
  );
}


const MessageBubble = ({ message, onA2UIAction }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`${styles.messageBubble} ${isUser ? styles.user : styles.assistant}`}>
      {/* 텍스트 내용 */}
      <div>
        {message.content}
      </div>

      {/* A2UI 블록이 있으면 렌더링 */}
      {message.a2ui && (
        <div className={styles.messageA2ui}>
          <A2UIRenderer block={message.a2ui} onAction={onA2UIAction} />
        </div>
      )}
    </div>
  );
}

export default MessageBubble;