import styles from './NextButton.module.css';
import type { MouseEventHandler } from 'react';

interface NextButtonProp {
    canMoveOn?: boolean;
    text: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    type?: "submit" | "reset" | "button" | undefined;
}

export const NextButton = ({ 
    canMoveOn = true,
    text,
    type,
    onClick
}: NextButtonProp) => {
    return (
      <button 
        className={styles.submitButton} 
        disabled={!canMoveOn} 
        type={type} 
        onClick={onClick}
        >
        {text}
      </button>
    )
}