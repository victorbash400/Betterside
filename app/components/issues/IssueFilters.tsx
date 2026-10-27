import { Search, X } from 'lucide-react';
import { issueColors, issueKinds } from '../../lib/catalogue';
import type { Filters } from '../../lib/types';
import styles from './IssueFilters.module.css';
export default function IssueFilters({filters,onChange,count}:{filters:Filters;onChange:(filters:Filters)=>void;count:number}) {
 return <div className={styles.filters}><label className={styles.search}><Search size={16}/><input aria-label="Search locations, issues or projects" placeholder="Search locations, issues, projects" value={filters.query} onChange={event=>onChange({...filters,query:event.target.value})}/>{filters.query&&<button aria-label="Clear search" onClick={()=>onChange({...filters,query:''})}><X size={14}/></button>}</label><div className={styles.categories} aria-label="Issue filters">{issueKinds.map(kind=><button key={kind} aria-pressed={filters.kinds.includes(kind)} onClick={()=>onChange({...filters,kinds:filters.kinds.includes(kind)?filters.kinds.filter(value=>value!==kind):[...filters.kinds,kind]})}><i style={{background:issueColors[kind]}}/>{kind}</button>)}</div><span className={styles.count}>{count} areas</span></div>;
}
