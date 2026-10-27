import { money } from '../../lib/catalogue';
import type { Issue } from '../../lib/types';
import styles from './ProjectFunding.module.css';
export default function ProjectFunding({project,onContribute}:{project:Issue['project'];onContribute:()=>void}) {
 return <section className={styles.funding}><div className={styles.label}><span>Project</span><span>Demo · Sandbox</span></div><h3>{project.name}</h3><p>{project.organisation}</p><div className={styles.totals}><strong>{money(project.raised)}</strong><span>of {money(project.target)}</span></div><progress value={project.raised} max={project.target} aria-label="Sandbox funding received"/><dl><div><dt>Funding gap</dt><dd>{money(Math.max(0,project.target-project.raised))}</dd></div><div><dt>Reported delivery</dt><dd>{project.reportedOutcome??'Not reported'}</dd></div><div><dt>Organisation</dt><dd>Sandbox recipient</dd></div></dl><button onClick={onContribute}>Contribute with PayPal<span>Sandbox</span></button></section>;
}
