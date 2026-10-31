import Image from "next/image";
import styles from "./WelcomePhoto.module.css";

type WelcomePhotoKind = "care" | "relief" | "health" | "restoration";

export default function WelcomePhoto({ kind }: { kind: WelcomePhotoKind }) {
  return (
    <div className={`${styles.photo} ${styles[kind]}`}>
      <Image
        src={`/images/welcome/${kind}.webp`}
        alt=""
        fill
        sizes="(max-width: 600px) 42vw, 19vw"
        preload
      />
    </div>
  );
}
