import { ArrowUpRight, Bookmark, X, MessageCircle } from 'lucide-react';
import IconButton from '../controls/IconButton';
import ProjectFunding from './ProjectFunding';
import { issueColors, freshness } from '../../lib/catalogue';
import type { Issue } from '../../lib/types';
import styles from './IssueDetails.module.css';
export default function IssueDetails({issue,followed,onFollow,onClose,onContribute,onAsk}:{issue:Issue;followed:boolean;onFollow:()=>void;onClose:()=>void;onContribute:()=>void;onAsk:()=>void}) {
 return <aside className={styles.details} aria-label={`${issue.location} details`}><div className={styles.handle}/><div className={styles.header}><span style={{color:issueColors[issue.kind]}}>{issue.kind}</span><IconButton label="Close area details" onClick={onClose}><X/></IconButton></div><div className={styles.content}><h2>{issue.location}</h2><div className={styles.status}>{issue.severity}</div><p className={styles.summary}>{issue.summary}</p><a className={styles.source} href={issue.source.url} target="_blank" rel="noreferrer">{issue.source.label}<ArrowUpRight size={13}/></a><span className={styles.date}>{freshness(issue.source)}</span><div className={styles.actions}><button aria-pressed={followed} onClick={onFollow}><Bookmark size={14} fill={followed?'currentColor':'none'}/>{followed?'Following':'Follow'}</button><button onClick={onAsk}><MessageCircle size={14}/>Ask about this area</button></div><ProjectFunding project={issue.project} onContribute={onContribute}/></div></aside>;
}
