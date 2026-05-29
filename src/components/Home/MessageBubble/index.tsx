import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../../core/util/types/generalTypes";
import A2UIRenderer from "../../a2ui/A2UIRenderer";
import styles from "./MessageBubble.module.css";

interface MessageBubbleProps {
  message: ChatMessage;
  /** A2UI 사용자 인터랙션 콜백 */
  onA2UIAction: (action: string, payload: unknown) => void;
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
  const hasContent = message.content && message.content.length > 0;
  const hasA2UI = message.a2uiBlocks && message.a2uiBlocks.length > 0;

  if (!hasContent && !hasA2UI) return null;

  return (
    <div className={`${styles.messageBubble} ${isUser ? styles.user : styles.assistant}`}>
      {/* 텍스트 내용 */}
      {hasContent && (
        <div className={styles.messageContent}>
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
      )}

      {/* A2UI 블록이 있으면 렌더링 */}
      {message.a2uiBlocks && (
        message.a2uiBlocks.map((b, i) => (
          <div key={`${message.id}-a2ui-${i}`} className={styles.messageA2ui}>
            <A2UIRenderer block={b} onAction={onA2UIAction} />
          </div>
        ))
      )}
    </div>
  );
}

export default MessageBubble;