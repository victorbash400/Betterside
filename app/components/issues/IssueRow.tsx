import { ChevronRight } from 'lucide-react';
import { issueColors } from '../../lib/catalogue';
import type { Issue } from '../../lib/types';
import styles from './IssueRow.module.css';
export default function IssueRow({issue,selected,onSelect}:{issue:Issue;selected:boolean;onSelect:()=>void}) {
 return <button className={styles.row} aria-pressed={selected} onClick={onSelect}><i style={{background:issueColors[issue.kind]}}/><span><strong>{issue.location}</strong><small>{issue.kind}</small></span><ChevronRight size={14}/></button>;
}
