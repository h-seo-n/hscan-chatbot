import { useState } from "react";
import styles from "./ChatInput.module.css";
import { FaArrowUp } from "react-icons/fa6";

interface ChatInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

/**
 * 채팅 입력 컴포넌트
 *
 * TODO: 멀티라인 입력 지원 (textarea 자동 높이 조절)
 * TODO: 파일 첨부 기능 (영상, 이미지 등)
 * TODO: 음성 입력 지원
 */
const ChatInput = ({
  placeholder = "무엇을 하고싶으신지 입력해주세요 ...",
  onSubmit,
}: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && onSubmit) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
        className={styles.chatContainer}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        className={styles.chatInput}
      />
      <button
        onClick={handleSubmit}
        className={styles.sendBtn}
        disabled={!value.trim()}
      >
        <FaArrowUp color="white" width={20}/>
      </button>
    </div>
  );
};

export default ChatInput;