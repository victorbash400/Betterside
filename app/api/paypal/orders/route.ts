import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { loadCatalogue } from '../../../server/catalogue';
import { amountInCents, decimalAmount } from '../../../lib/payment';
import { paypalRequest } from '../../../server/paypal';
import { donorSession } from '../../../server/donor';
import { recordPayment } from '../../../server/contributions';
import { sameOrigin, apiError } from '../../../server/http';
export async function POST(request:Request){try{
 sameOrigin(request);
 const input=z.object({projectId:z.string(),amount:z.string()}).strict().parse(await request.json());
 const issues=await loadCatalogue();
 const issue=issues.find(issue=>issue.project.id===input.projectId);if(!issue)throw new Error('Project not found.');
 const donor=await donorSession(true);if(!donor)throw new Error('Could not create donor session.');
 const cents=amountInCents(input.amount),amount=decimalAmount(cents),origin=new URL(request.url).origin;
 const data=await paypalRequest('/v2/checkout/orders',{intent:'CAPTURE',purchase_units:[{reference_id:issue.project.id,custom_id:issue.project.id,description:`BetterSide Sandbox: ${issue.project.name}`,amount:{currency_code:'USD',value:amount}}],payment_source:{paypal:{experience_context:{brand_name:'BetterSide Sandbox',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',return_url:`${origin}/paypal/return`,cancel_url:`${origin}/paypal/cancel`}}}},randomUUID());
 const order=z.object({id:z.string(),links:z.array(z.object({rel:z.string(),href:z.url()}))}).parse(data);
 const approvalUrl=order.links.find(link=>link.rel==='payer-action'||link.rel==='approve')?.href;if(!approvalUrl||new URL(approvalUrl).hostname!=='www.sandbox.paypal.com')throw new Error('PayPal approval URL rejected.');
 await recordPayment({id:order.id,donor,cents,amount,currency:'USD',projectId:issue.project.id,projectKey:issue.id,projectName:issue.project.name,recipient:process.env.PAYPAL_CLIENT_ID!,status:'CREATED',createdAt:new Date().toISOString()});
 return Response.json({id:order.id,approvalUrl});
 }catch(error){return apiError(error);}}
