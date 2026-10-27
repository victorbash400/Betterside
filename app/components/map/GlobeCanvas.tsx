'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Map, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { issueColors } from '../../lib/catalogue';
import type { Issue, Filters } from '../../lib/types';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import AreaIndex from '../issues/AreaIndex';
import { cleanMapStyle } from './mapStyle';
import styles from './GlobeCanvas.module.css';
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs',import.meta.url).toString());
export default function GlobeCanvas({issues,selected,metric,onMetric,onSelect,projection,onProjection}:{issues:Issue[];selected?:Issue;metric:Filters['metric'];onMetric:(metric:Filters['metric'])=>void;onSelect:(issue:Issue)=>void;projection:'globe'|'mercator';onProjection:(projection:'globe'|'mercator')=>void}) {
 const container=useRef<HTMLDivElement>(null),map=useRef<Map|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const pick=useEffectEvent((id:string)=>{const issue=issues.find(item=>item.id===id);if(issue)onSelect(issue);});
 useEffect(()=>{
  if(!container.current)return;
  let instance:Map;
  setReady(false);setError('');
  try {instance=new Map({container:container.current,center:[28,15],zoom:0.65,attributionControl:false,canvasContextAttributes:{antialias:true},maxZoom:17});}catch{setError('WebGL unavailable. Enable hardware acceleration and retry.');return;}
  map.current=instance;
  instance.setStyle('https://tiles.openfreemap.org/styles/liberty',{transformStyle:(_,style)=>cleanMapStyle(style)});
  instance.on('load',()=>{
   instance.addSource('issues',{type:'geojson',data:{type:'FeatureCollection',features:[]},cluster:true,clusterMaxZoom:4,clusterRadius:34});
   instance.addLayer({id:'issue-halo',type:'circle',source:'issues',filter:['!', ['has','point_count']],paint:{'circle-radius':['interpolate',['linear'],['zoom'],0,10,6,18],'circle-color':['get','color'],'circle-opacity':0.12}});
   instance.addLayer({id:'issue-point',type:'circle',source:'issues',filter:['!', ['has','point_count']],paint:{'circle-radius':5,'circle-color':'#fafaf8','circle-stroke-width':2,'circle-stroke-color':['get','color']}});
   instance.addLayer({id:'issue-hit',type:'circle',source:'issues',filter:['!', ['has','point_count']],paint:{'circle-radius':22,'circle-opacity':0}});
   instance.addLayer({id:'issue-clusters',type:'circle',source:'issues',filter:['has','point_count'],paint:{'circle-color':'#626f62','circle-radius':16,'circle-stroke-color':'#fafaf8','circle-stroke-width':2}});
   instance.addLayer({id:'issue-count',type:'symbol',source:'issues',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':11},paint:{'text-color':'#ffffff'}});
   instance.on('click','issue-hit',event=>{const id=event.features?.[0]?.properties?.id;if(typeof id==='string')pick(id);});
   instance.on('click','issue-clusters',async event=>{const feature=event.features?.[0];if(!feature||feature.geometry.type!=='Point')return;const source=instance.getSource<GeoJSONSource>('issues');if(!source)return;try{const zoom=await source.getClusterExpansionZoom(feature.properties.cluster_id);instance.easeTo({center:feature.geometry.coordinates as [number,number],zoom,duration:500});}catch{setError('Could not expand this area.');}});
   for(const id of ['issue-hit','issue-clusters']) {instance.on('mouseenter',id,()=>{instance.getCanvas().style.cursor='pointer';});instance.on('mouseleave',id,()=>{instance.getCanvas().style.cursor='';});}
   setReady(true);
  });
  instance.on('error',event=>{if(!instance.isStyleLoaded())setError('Map tiles could not load.');else if(event.error?.message?.includes('issues'))setError('Issue layer could not load.');});
  const observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
  return ()=>{observer.disconnect();instance.remove();map.current=null;};
 },[attempt]);
 useEffect(()=>{if(!ready||!map.current)return;map.current.getSource<GeoJSONSource>('issues')?.setData({type:'FeatureCollection',features:issues.map(issue=>({type:'Feature',id:issue.id,geometry:{type:'Point',coordinates:issue.coordinates},properties:{id:issue.id,color:issueColors[issue.kind],severity:issue.severity,freshness:!issue.source.published?'Unknown':Date.now()-Date.parse(issue.source.published)>90*86400000?'Outdated':'Recent',gap:issue.project.target-issue.project.raised}}))});},[ready,issues]);
 useEffect(()=>{if(!ready||!map.current)return;const instance=map.current;instance.setProjection({type:projection});instance.setPaintProperty('issue-point','circle-radius',metric==='Funding gap'?['interpolate',['linear'],['get','gap'],0,4,150000,11]:5);instance.setPaintProperty('issue-point','circle-color',metric==='Funding gap'?['get','color']:metric==='Severity'?['match',['get','severity'],'Critical','#c85a46','High','#d09538','#fafaf8']:['match',['get','freshness'],'Recent','#54734c','Outdated','#d09538','#fafaf8']);},[ready,projection,metric]);
 useEffect(()=>{if(!ready||!selected||!map.current)return;map.current.flyTo({center:selected.coordinates,zoom:4.5,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:900});},[ready,selected]);
 return <div className={styles.canvas}><div ref={container} className={styles.map} role="region" aria-label="Interactive world globe"/>{!ready&&!error&&<div className={styles.loading} role="status">Loading globe</div>}{error&&<div className={styles.error} role="alert">{error}<button onClick={()=>setAttempt(value=>value+1)}>Retry</button></div>}<AreaIndex issues={issues} selectedId={selected?.id} onSelect={onSelect}/><MapControls globe={projection==='globe'} onProjection={()=>onProjection(projection==='globe'?'mercator':'globe')} onZoom={direction=>direction>0?map.current?.zoomIn():map.current?.zoomOut()} onReset={()=>map.current?.flyTo({center:[28,15],zoom:0.65,pitch:0,bearing:0,duration:500})}/><MapLegend metric={metric} onMetric={onMetric}/><div className={styles.attribution}><a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div></div>;
}
