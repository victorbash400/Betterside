import WelcomeArtwork from "./WelcomeArtwork";
import styles from "./SignInWelcome.module.css";

export default function SignInWelcome({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className={styles.welcome} aria-label="Welcome to BetterSide">
      <div className={styles.canvas}>
        <WelcomeArtwork />
        <div className={styles.identity}>
          <span className={styles.logo} aria-hidden="true" />
          <h1>BetterSide</h1>
          <button type="button" onClick={onSignIn}>Sign in</button>
        </div>
      </div>
    </section>
  );
}
