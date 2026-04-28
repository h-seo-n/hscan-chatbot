import { useState } from 'react';
import Modal from './';
import styles from './AuthModal.module.css';

export interface SignupFormValues {
  phone: string;
  password: string;
}

type VerificationStatus = 'idle' | 'pending' | 'verified';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SignupFormValues) => void | Promise<void>;
  onVerifyPhone: (phone: string) => Promise<boolean>;
  onSwitchToLogin: () => void;
  loading?: boolean;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSubmit,
  onVerifyPhone,
  onSwitchToLogin,
  loading = false,
}: SignupModalProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [verification, setVerification] = useState<VerificationStatus>('idle');

  const passwordMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  const canSubmit =
    !!phone &&
    !!password &&
    !!passwordConfirm &&
    !passwordMismatch &&
    verification === 'verified' &&
    !loading;

  const handleVerify = async () => {
    if (!phone || verification === 'pending') return;
    setVerification('pending');
    try {
      const ok = await onVerifyPhone(phone);
      setVerification(ok ? 'verified' : 'idle');
    } catch {
      setVerification('idle');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (verification === 'verified') setVerification('idle');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({ phone, password });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className={styles.title}>HScan 회원이 되고 더 많은 기능을 누려보세요.</h2>

      <div className={styles.form}>
        <div className={styles.inputWithButton}>
          <input
            type="tel"
            className={styles.input}
            placeholder="전화번호"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            autoComplete="tel"
            disabled={verification === 'verified'}
          />
          <button
            type="button"
            className={styles.verifyButton}
            onClick={handleVerify}
            disabled={!phone || verification !== 'idle'}
          >
            {verification === 'verified'
              ? '완료'
              : verification === 'pending'
                ? '확인중'
                : '인증'}
          </button>
        </div>

        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoComplete="new-password"
        />

        <div className={styles.fieldGroup}>
          <input
            type="password"
            className={`${styles.input} ${passwordMismatch ? styles.inputError : ''}`}
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete="new-password"
          />
          {passwordMismatch && (
            <span className={styles.errorText}>비밀번호가 일치하지 않습니다.</span>
          )}
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </div>

      <button type="button" className={styles.switchLink} onClick={onSwitchToLogin}>
        계정이 있으신가요? 로그인하기
      </button>
    </Modal>
  );
}