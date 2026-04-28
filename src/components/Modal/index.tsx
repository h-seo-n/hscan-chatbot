import { type ReactNode, /* useEffect */ } from 'react';
import styles from './Modal.module.css';
 
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {

/** close on ESC press -> not applied to auth popups, users cannot close on purpose */
//   useEffect(() => {
//    if (!isOpen) return;
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') onClose();
//     };
//     document.addEventListener('keydown', handleEsc);
//     document.body.style.overflow = 'hidden';
 
//     return () => {
//       document.removeEventListener('keydown', handleEsc);
//       document.body.style.overflow = '';
//     };    
//   }, [isOpen, onClose])

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}