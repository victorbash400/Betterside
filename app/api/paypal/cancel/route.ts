import { z } from 'zod';
import { donorSession } from '../../../server/donor';
import { payment, changePaymentStatus } from '../../../server/contributions';
import { sameOrigin, apiError } from '../../../server/http';
export async function POST(request:Request){try{sameOrigin(request);const {orderId}=z.object({orderId:z.string().min(1).max(64)}).parse(await request.json());const record=await payment(orderId);if(!record||record.donor!==await donorSession())return Response.json({error:'Contribution not found.'},{status:404});if(record.status==='CREATED')await changePaymentStatus(record,'CANCELLED');return Response.json({status:record.status==='CREATED'?'CANCELLED':record.status});}catch(error){return apiError(error);}}
