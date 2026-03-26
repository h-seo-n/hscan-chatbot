import styles from "./ActionCard.module.css";

interface ActionCardProps {
  iconUrl: string;
  label: string;
  onClick?: () => void;
}

const ActionCard = ({ iconUrl, label, onClick }: ActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={styles.actionContainer}
    >
      <div
        className={styles.iconContainer}
      >
        <img src={iconUrl} alt={`icon of ${label} action`} />
      </div>
      <span
        className={styles.actionLabel}
      >
        {label}
      </span>
    </button>
  );
};

export default ActionCard;