'use client';
import { useMemo, useState } from 'react';
import { AgStudio } from 'ag-studio-react';
import { AgStudioLicenseManager, studioTheme, type AgReportState } from 'ag-studio';
import { dashboardRows, dashboardState } from '../../lib/dashboard';
import type { Issue } from '../../lib/types';
import styles from './StudioDashboard.module.css';
const license=process.env.NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY;
if(license)AgStudioLicenseManager.setLicenseKey(license);
const theme=studioTheme.withParams({fontFamily:'Geist, sans-serif',fontSize:12,accentColor:'#54734c',backgroundColor:'#fafaf8',foregroundColor:'#292b28',borderColor:'#ddded7',studioWidgetBorder:false,studioWidgetBorderRadius:10,studioWidgetBackgroundColor:'#f3f3f0'});
export default function StudioDashboard({issues}:{issues:Issue[]}) {
 const [editing,setEditing]=useState(false),[error,setError]=useState(''),[initialState]=useState<AgReportState>(dashboardState);
 const data=useMemo(()=>({sources:[{id:'projects',name:'Demonstration projects',data:dashboardRows(issues)}]}),[issues]);
 return <section className={styles.dashboard} aria-label="Project analytics"><div className={styles.toolbar}><span>Demonstration data · USD</span><button aria-pressed={editing} onClick={()=>setEditing(value=>!value)}>{editing?'Done':'Edit dashboard'}</button></div>{error&&<div role="alert" className={styles.error}>{error}</div>}<div className={styles.studio}><AgStudio theme={theme} data={data} mode={editing?'edit':'view'} initialState={initialState} onErrorRaised={()=>setError('Dashboard could not render.')} /></div></section>;
}
