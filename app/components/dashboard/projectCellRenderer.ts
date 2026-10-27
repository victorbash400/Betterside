import type { ICellRendererParams } from 'ag-grid-enterprise';
import type { Issue } from '../../lib/types';
import styles from './ProjectCell.module.css';
export function projectCellRenderer(issues:Issue[],onSelect:(issue:Issue)=>void){
 return (params:ICellRendererParams)=>{
  const issue=issues.find(issue=>issue.location===params.value);
  if(!issue)return document.createTextNode(String(params.value??''));
  const button=document.createElement('button');
  button.type='button';button.className=styles.link;button.textContent=issue.location;
  button.setAttribute('aria-label',`Open ${issue.location} details`);
  button.addEventListener('click',()=>onSelect(issue));
  return button;
 };
}
