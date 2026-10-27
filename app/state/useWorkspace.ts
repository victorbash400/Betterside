'use client';
import { useEffect, useMemo, useState } from 'react';
import { filterIssues, issues } from '../lib/catalogue';
import type { Filters, Issue, View } from '../lib/types';
export function useWorkspace(){
 const [catalogue,setCatalogue]=useState(issues);
 const [view,setView]=useState<View>('Explore'),[filters,setFilters]=useState<Filters>({query:'',kinds:[],metric:'Severity'}),[selectedId,setSelectedId]=useState<string>(),[following,setFollowing]=useState<string[]>([]),[projection,setProjection]=useState<'globe'|'mercator'>('globe'),[model,setModel]=useState<'fast'|'reasoning'>('fast');
 const [chatOpen,setChatOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[navigationOpen,setNavigationOpen]=useState(false),[checkout,setCheckout]=useState<Issue>(),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 useEffect(()=>{const controller=new AbortController();async function load(){try{const response=await fetch('/api/catalogue',{signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error??'Could not load funding records.');setCatalogue(data.issues);}catch(error){if(error instanceof Error&&error.name==='AbortError')return;setError('Could not load funding records.');}}void load();return()=>controller.abort();},[]);
 useEffect(()=>{try{const raw=localStorage.getItem('betterside-following');if(raw){const value:unknown=JSON.parse(raw);if(!Array.isArray(value)||!value.every(item=>typeof item==='string'))throw new Error();setFollowing(value);}const savedModel=localStorage.getItem('betterside-model');if(savedModel==='fast'||savedModel==='reasoning')setModel(savedModel);}catch{setError('Could not restore saved preferences.');}setLoaded(true);},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem('betterside-following',JSON.stringify(following));localStorage.setItem('betterside-model',model);}catch{setError('Could not save preferences.');}},[following,model,loaded]);
 const records=useMemo(()=>filterIssues(view==='Following'?catalogue.filter(issue=>following.includes(issue.id)):catalogue,filters),[catalogue,filters,following,view]);
 const selected=catalogue.find(issue=>issue.id===selectedId);
 function follow(id:string){setFollowing(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]);}
 return {view,setView,filters,setFilters,selected,setSelectedId,following,follow,projection,setProjection,model,setModel,chatOpen,setChatOpen,settingsOpen,setSettingsOpen,navigationOpen,setNavigationOpen,checkout,setCheckout,error,setError,records};
}
