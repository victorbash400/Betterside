import { ArrowUp, MapPin, Square } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import styles from './ChatComposer.module.css';
export default function ChatComposer({draft,onDraft,onSend,busy,onStop,location}:{draft:string;onDraft:(draft:string)=>void;onSend:()=>void;busy:boolean;onStop:()=>void;location?:string}) {
 const input=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{const field=input.current;if(!field)return;const resize=()=>{field.style.height='auto';field.style.height=`${Math.min(field.scrollHeight,140)}px`;};resize();const observer=new ResizeObserver(resize);observer.observe(field);return()=>observer.disconnect();},[draft]);
 return <form className={styles.composer} onSubmit={event=>{event.preventDefault();if(draft.trim()&&!busy)onSend();}}><textarea ref={input} rows={1} aria-label="Message" placeholder="Ask about a place or project" value={draft} onChange={event=>onDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();if(draft.trim()&&!busy)onSend();}}}/><div className={styles.row}><span><MapPin size={13}/>{location??'Worldwide'}</span>{busy?<button type="button" className={styles.send} aria-label="Stop response" onClick={onStop}><Square size={13}/></button>:<button type="submit" className={styles.send} aria-label="Send message" disabled={!draft.trim()}><ArrowUp size={16}/></button>}</div></form>;
}
