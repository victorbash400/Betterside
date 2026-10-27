'use client';
import { useMemo, useState } from 'react';
import { AgStudio } from 'ag-studio-react';
import { AgStudioLicenseManager, studioTheme, type AgReportState } from 'ag-studio';
import { dashboardRows, dashboardState } from '../../lib/dashboard';
import { useNarrowLayout } from '../../state/useNarrowLayout';
import type { Analysis } from '../../lib/analysis';
import type { Issue } from '../../lib/types';
import styles from './StudioDashboard.module.css';
const license=process.env.NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY;
if(license)AgStudioLicenseManager.setLicenseKey(license);
const theme=studioTheme.withParams({fontFamily:'Geist, sans-serif',fontSize:12,accentColor:'#54734c',backgroundColor:'#fafaf8',foregroundColor:'#292b28',borderColor:'#ddded7',studioWidgetBorder:false,studioWidgetBorderRadius:10,studioWidgetBackgroundColor:'#f3f3f0'});
export default function StudioDashboard({issues,analysis}:{issues:Issue[];analysis?:Analysis}) {
 const narrow=useNarrowLayout();
 const [editing,setEditing]=useState(false),[error,setError]=useState(''),[savedStates,setSavedStates]=useState<Partial<Record<'mobile'|'desktop',AgReportState>>>({});
 const initialState=useMemo<AgReportState>(()=>{const next=structuredClone(analysis?dashboardState:savedStates[narrow?'mobile':'desktop']??dashboardState);if(narrow){for(const page of next.pages){page.layout={...page.layout,minWidth:0,columns:1,pagePadding:10,widgetPadding:10};if(page.widgetLayout)for(const layout of Object.values(page.widgetLayout)){if(layout){layout.xTrack=0;layout.xSpan=1;}}if(page.widgets?.projects?.type==='grid')page.widgets.projects.dataMapping.cols=[{id:'projects.location'},{id:'projects.issue'},{id:'projects.gap'}];}}if(!analysis)return next;const page=next.pages[0];if(analysis.kind==='funding-by-issue'&&page.widgets?.funding&&'dataMapping' in page.widgets.funding){page.widgets.funding={type:'column-chart-stacked',dataMapping:{categoryKey:[{id:'projects.issue'}],valueKey:[{id:'projects.received',aggregation:'sum'},{id:'projects.gap',aggregation:'sum'}]},format:{title:{text:'Sandbox funding by issue',enabled:true}}};}if(analysis.kind==='project-comparison'){page.widgetLayout={projects:{xTrack:0,yTrack:0,xSpan:12,ySpan:12}};delete page.widgets?.funding;}if(narrow&&page.widgetLayout)for(const layout of Object.values(page.widgetLayout)){if(layout){layout.xTrack=0;layout.xSpan=1;}}return next;},[analysis,savedStates,narrow]);
 const data=useMemo(()=>({sources:[{id:'projects',name:'Demonstration projects',data:dashboardRows(issues)}]}),[issues]);
 return <section className={styles.dashboard} aria-label="Project analytics"><div className={styles.toolbar}><span>Demonstration data · USD</span><button aria-pressed={editing} onClick={()=>setEditing(value=>!value)}>{editing?'Done':'Edit dashboard'}</button></div>{error&&<div role="alert" className={styles.error}>{error}</div>}<div className={styles.studio}><AgStudio key={`${analysis?.id??'overview'}-${narrow?'mobile':'desktop'}`} onStateUpdated={event=>setSavedStates(previous=>({...previous,[narrow?'mobile':'desktop']:event.api.getState()}))} theme={theme} data={data} mode={editing?'edit':'view'} initialState={initialState} onErrorRaised={()=>setError('Dashboard could not render.')} /></div></section>;
}
