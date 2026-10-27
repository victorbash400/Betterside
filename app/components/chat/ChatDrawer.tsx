'use client';
import { useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageCircle, SquarePen, X } from 'lucide-react';
import IconButton from '../controls/IconButton';
import MessageList from './MessageList';
import ChatComposer from './ChatComposer';
import type { Issue } from '../../lib/types';
import styles from './ChatDrawer.module.css';
export default function ChatDrawer({selected,onClose,model}:{selected?:Issue;onClose:()=>void;model:'fast'|'reasoning'}) {
 const [draft,setDraft]=useState('');
 const transport=useMemo(()=>new DefaultChatTransport({api:'/api/chat',body:{areaId:selected?.id,model}}),[selected?.id,model]);
 const {messages,sendMessage,status,stop,error,regenerate,setMessages}=useChat({transport});
 const [storageError,setStorageError]=useState('');
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{try{const saved=localStorage.getItem('betterside-chat');if(saved){const value=JSON.parse(saved);if(Array.isArray(value))setMessages(value);}setDraft(localStorage.getItem('betterside-draft')??'');}catch{setStorageError('Could not restore conversation.');}setHydrated(true);},[setMessages]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem('betterside-chat',JSON.stringify(messages));localStorage.setItem('betterside-draft',draft);}catch{setStorageError('Could not save conversation.');}},[draft,messages,hydrated]);
 const busy=status==='submitted'||status==='streaming';
 return <aside className={styles.drawer} aria-label="BetterSide chat"><header><MessageCircle size={16}/><span>Ask BetterSide</span><IconButton label="New conversation" onClick={()=>{void stop();setMessages([]);setDraft('');}}><SquarePen/></IconButton><IconButton label="Close chat" onClick={onClose}><X/></IconButton></header>{messages.length===0?<div className={styles.starters}>{['Which water projects need funding?','Compare the available projects','What do we know about Sudan?'].map(text=><button key={text} onClick={()=>void sendMessage({text})}>{text}</button>)}</div>:null}<MessageList messages={messages} busy={busy}/>{(error||storageError)&&<div className={styles.error} role="alert"><span>{storageError||error?.message||'Chat failed.'}</span>{error&&<button onClick={()=>void regenerate()}>Retry</button>}</div>}<ChatComposer draft={draft} onDraft={setDraft} busy={busy} location={selected?.location} onStop={()=>void stop()} onSend={()=>{if(!draft.trim())return;void sendMessage({text:draft.trim()});setDraft('');}}/></aside>;
}
