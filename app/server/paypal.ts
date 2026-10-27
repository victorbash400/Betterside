import 'server-only';
import { z } from 'zod';
const base='https://api-m.sandbox.paypal.com';
export async function paypalToken(){
 if(process.env.PAYPAL_ENVIRONMENT!=='sandbox')throw new Error('Only PayPal sandbox is enabled.');
 const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;
 if(!id||!secret)throw new Error('Configure PayPal sandbox credentials.');
 const response=await fetch(`${base}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',cache:'no-store'});
 const data=await response.json();
 if(!response.ok)throw new Error('PayPal authentication failed.');
 return z.object({access_token:z.string()}).parse(data).access_token;
}
export async function paypalRequest(path:string,body?:unknown,requestId?:string){
 const token=await paypalToken();
 const response=await fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
 const data=await response.json();
 if(!response.ok)throw new Error(`PayPal request failed (${response.status}).`);
 return data;
}
