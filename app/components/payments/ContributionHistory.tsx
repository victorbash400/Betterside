'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Contribution } from '../../lib/types';
import styles from './ContributionHistory.module.css';
export default function ContributionHistory({onExplore}:{onExplore:()=>void}) {
 const [records,setRecords]=useState<Contribution[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 const load=useCallback(async(signal?:AbortSignal)=>{setBusy(true);setError('');try{const response=await fetch('/api/contributions',{signal});const data=await response.json();if(!response.ok)throw new Error(data.error??'Could not load contributions.');setRecords(data.contributions);}catch(error){if(error instanceof Error&&error.name==='AbortError')return;setError(error instanceof Error?error.message:'Could not load contributions.');}finally{setBusy(false);}},[]);
 useEffect(()=>{const abort=new AbortController();void load(abort.signal);return()=>abort.abort();},[load]);
 return <section className={styles.history} aria-label="Contribution history">{busy?<span role="status">Loading contributions</span>:error?<div className={styles.error} role="alert">{error}<button onClick={()=>void load()}>Retry</button></div>:records.length?<div className={styles.rows}>{records.map(record=><div key={record.id} className={styles.row}><div><strong>{record.projectName}</strong><span>{new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(record.createdAt))} · Sandbox</span></div><div><strong>{record.currency} {record.amount}</strong><span>{record.status}</span></div></div>)}</div>:<button className={styles.explore} onClick={onExplore}>Explore projects</button>}</section>;
}
