import { Globe2, ChartNoAxesCombined, Heart, Bookmark, MessageCircle, Settings2, X, ArrowUpRight } from 'lucide-react';
import IconButton from '../controls/IconButton';
import type { View } from '../../lib/types';
import styles from './Sidebar.module.css';
const destinations = [{name:'Explore',icon:Globe2},{name:'Dashboard',icon:ChartNoAxesCombined},{name:'Contributions',icon:Heart},{name:'Following',icon:Bookmark}] as const;
export default function Sidebar({view,onView,onChat,onSettings,open,onClose}:{view:View;onView:(view:View)=>void;onChat:()=>void;onSettings:()=>void;open:boolean;onClose:()=>void}) {
 return <><aside className={`${styles.sidebar} ${open?styles.open:''}`} aria-label="Main navigation"><div className={styles.brand}><Globe2 size={22}/><span>BetterSide</span><IconButton label="Close navigation" className={styles.close} onClick={onClose}><X/></IconButton></div><nav className={styles.nav}>{destinations.map(({name,icon:Icon})=><button key={name} aria-current={view===name?'page':undefined} onClick={()=>{onView(name);onClose();}}><Icon size={17}/>{name}</button>)}</nav><div className={styles.secondary}><button onClick={onChat}><MessageCircle size={17}/>Ask BetterSide<ArrowUpRight size={14}/></button><button onClick={onSettings}><Settings2 size={17}/>Settings</button></div><span className={styles.sandbox}>Sandbox</span></aside>{open&&<button className={styles.backdrop} aria-label="Close navigation" onClick={onClose}/>}</>;
}
