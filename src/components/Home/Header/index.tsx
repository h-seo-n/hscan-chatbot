/** Header file on top */
import logo from "../../../assets/logo.svg";
import styles from "./Header.module.css";

interface HeaderProps {
    onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    return (
        <header
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
        }}
        >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <img src={logo} alt="Hscan logo with an 'Hh' shaped icon, and navy color" />
        </div>
        <button
            onClick={onLoginClick}
            className={styles.loginButton}
        >
            Log In
        </button>
        </header>
    );
};

export default Header;