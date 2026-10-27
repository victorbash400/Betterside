import type { Issue } from '../../lib/types';
import IssueRow from './IssueRow';
import styles from './AreaIndex.module.css';
export default function AreaIndex({issues,selectedId,onSelect}:{issues:Issue[];selectedId?:string;onSelect:(issue:Issue)=>void}) {
 return <section className={styles.index} aria-label="Areas"><div className={styles.heading}><span>Areas</span><span>{issues.length}</span></div><div className={styles.list}>{issues.map(issue=><IssueRow key={issue.id} issue={issue} selected={selectedId===issue.id} onSelect={()=>onSelect(issue)}/>)}</div></section>;
}
