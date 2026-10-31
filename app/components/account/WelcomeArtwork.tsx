import WelcomePhoto from "./WelcomePhoto";
import styles from "./WelcomeArtwork.module.css";

export default function WelcomeArtwork() {
  return (
    <div className={styles.artwork} aria-hidden="true">
      <svg className={styles.definitions} width="0" height="0">
        <defs>
          <linearGradient id="welcome-thread" x1="195" y1="300" x2="1510" y2="735" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8fb8bc" stopOpacity=".65" />
            <stop offset=".37" stopColor="#8fb8bc" stopOpacity=".55" />
            <stop offset=".43" stopColor="#8fb8bc" stopOpacity="0" />
            <stop offset=".59" stopColor="#8fb8bc" stopOpacity="0" />
            <stop offset=".68" stopColor="#8fb8bc" stopOpacity=".65" />
            <stop offset="1" stopColor="#8fb8bc" stopOpacity=".8" />
          </linearGradient>
          <clipPath id="welcome-relief-crop" clipPathUnits="objectBoundingBox">
            <path d="M .14 0 C .35 .006 .67 .025 .85 .033 Q 1 .045 1 .19 L 1 .87 Q 1 1 .87 1 L .14 .965 Q 0 .96 0 .81 L 0 .15 Q 0 0 .14 0 Z" />
          </clipPath>
          <clipPath id="welcome-health-crop" clipPathUnits="objectBoundingBox">
            <path d="M .21 .115 Q .59 .035 .79 .005 Q 1 -.025 1 .145 L 1 .735 Q 1 .895 .85 .92 L .17 .995 Q 0 1.025 0 .855 L 0 .31 Q 0 .16 .21 .115 Z" />
          </clipPath>
        </defs>
      </svg>
      <svg className={styles.connections} viewBox="0 0 1672 941" fill="none">
        <path d="M 278 301 C 146 301 188 441 264 503 M 421 600 C 475 621 451 666 516 696 C 575 725 628 736 694 737 M 971 726 C 1042 704 1087 659 1139 626 C 1161 584 1160 543 1212 514 C 1287 472 1356 535 1423 508 C 1521 469 1544 372 1451 341" stroke="url(#welcome-thread)" strokeWidth=".9" />
        <path d="M 209 204 Q 207 158 254 165 L 303 175 Q 350 185 347 235 L 340 270 Q 334 304 289 301 L 258 297 Q 204 290 208 239 Z" fill="#dce7e7" />
        <path d="M 1196 206 Q 1195 164 1234 164 L 1289 162 Q 1328 161 1327 201 L 1326 245 Q 1327 285 1287 286 L 1233 285 Q 1195 287 1196 248 Z" fill="#e7eae7" />
        <rect x="465" y="609" width="67" height="67" rx="19" fill="#b8d3d5" />
        <path d="M 1468 590 C 1577 584 1562 724 1477 730 Z" fill="#eef0ed" />
        <circle cx="236.5" cy="474.5" r="8.3" fill="#80afb4" />
        <circle cx="598" cy="355" r="8.2" fill="#e5e9e3" />
        <circle cx="1205" cy="313" r="14.4" fill="#b1cbcc" />
        <circle cx="1138.5" cy="625.5" r="8.4" fill="#bbc5ae" />
      </svg>
      <svg className={styles.mobileConnections} viewBox="0 0 390 844" fill="none" preserveAspectRatio="none">
        <path d="M 48 185 C -10 207 1 286 47 304 C 86 321 89 351 74 380 M 339 211 C 395 246 383 293 349 307 M 40 664 C 8 607 44 576 88 582 M 300 658 C 365 626 383 577 350 549" stroke="#a9c8ca" strokeWidth=".7" />
        <rect x="11" y="56" width="62" height="68" rx="22" fill="#dce7e7" />
        <rect x="282" y="53" width="49" height="58" rx="17" fill="#e7eae7" />
        <rect x="124" y="728" width="38" height="38" rx="12" fill="#b8d3d5" />
        <ellipse cx="347" cy="739" rx="35" ry="43" fill="#eef0ed" />
        <circle cx="27" cy="280" r="4" fill="#80afb4" />
        <circle cx="373" cy="278" r="6" fill="#b1cbcc" />
        <circle cx="346" cy="599" r="4" fill="#bbc5ae" />
      </svg>
      <WelcomePhoto kind="care" />
      <WelcomePhoto kind="relief" />
      <WelcomePhoto kind="health" />
      <WelcomePhoto kind="restoration" />
    </div>
  );
}
