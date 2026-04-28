import { useState } from 'react';
import Modal from './';
import styles from './AuthModal.module.css';

export interface LoginFormValues {
  phone: string;
  password: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  onSwitchToSignup: () => void;
  loading?: boolean;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSubmit,
  onSwitchToSignup,
  loading = false,
}: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = !!phone && !!password && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({ phone, password });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className={styles.title}>서비스를 이용하기 위해서는 로그인이 필요해요</h2>

      <div className={styles.form}>
        <input
          type="tel"
          className={styles.input}
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoComplete="tel"
        />
        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoComplete="current-password"
        />

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>

      <button type="button" className={styles.switchLink} onClick={onSwitchToSignup}>
        계정이 없으신가요? 회원가입하기
      </button>
    </Modal>
  );
}