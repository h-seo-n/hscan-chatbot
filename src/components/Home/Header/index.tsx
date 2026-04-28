/** Header file on top */
import logo from "../../../assets/logo.svg";
import { useAuth } from "../../../core/util/auth/useAuth";
import styles from "./Header.module.css";

const Header = () => {
    const { user, login, logout, isLoading } = useAuth();

    // const userInfo:string = JSON.stringify(user);

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
        <div
            style={({
                display: "flex",
                flexFlow: "row nowrap",
                gap: "4px",
            })}
        >
            <button
                onClick={user ? logout : login}
                className={`${styles.authBtn} ${styles.loginButton}`}
                disabled={isLoading}
            >
                {user ? "로그아웃" : "로그인"}
            </button>
            {user && 
            <span
                className={`${styles.authBtn} ${styles.userInfoBtn}`}
                >
                    {`${user.name}님`}
            </span>
            }
        </div>
        </header>
    );
};

export default Header;