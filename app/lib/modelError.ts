import { APICallError } from 'ai';
export function modelError(error:unknown){
 if(APICallError.isInstance(error)){
  if(error.statusCode===429)return 'Model quota unavailable. Select Flash or update API quota.';
  if(error.statusCode===401||error.statusCode===403)return 'Model access denied. Check API credentials.';
 }
 return 'Model request failed. Retry or select another model.';
}
