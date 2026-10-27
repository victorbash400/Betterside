import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { database, requireTable } from '../app/server/aws.ts';
import { recordPayment, completePayment, payment } from '../app/server/contributions.ts';
import { recordRefund } from '../app/server/payment-events.ts';
test('isolated AWS fixture captures once, refunds once, and preserves isolation',async()=>{
 assert.equal(requireTable(),'BetterSide-dev');
 const suffix=randomUUID(),id=`qa-${suffix}`,donor=`qa-${suffix}`,projectId=`qa-${suffix}`,eventId=`qa-${suffix}`,createdAt=new Date().toISOString(),captureId=`qa-capture-${suffix}`;
 const record={id,donor,cents:100,amount:'1.00',currency:'USD' as const,projectId,projectKey:projectId,projectName:'Isolated QA fixture',recipient:'qa',status:'CREATED' as const,createdAt};
 const TableName=requireTable();
 const keys=[{pk:`PAYMENT#${id}`,sk:'META'},{pk:`DONOR#${donor}`,sk:`PAYMENT#${createdAt}#${id}`},{pk:`PROJECT#${projectId}`,sk:'FUNDING'},{pk:`EVENT#${eventId}`,sk:'META'}];
 try{
  await recordPayment(record);
  await Promise.all([completePayment(record,captureId),completePayment(record,captureId)]);
  const funding=()=>database.send(new GetCommand({TableName,Key:keys[2],ConsistentRead:true}));
  assert.equal((await funding()).Item?.receivedCents,100);
  const captured=await payment(id);assert.equal(captured?.status,'COMPLETED');assert.ok(captured);
  await recordRefund(captured,eventId,`qa-refund-${suffix}`,100);
  await assert.rejects(()=>recordRefund(captured,eventId,`qa-refund-${suffix}`,100));
  assert.equal((await funding()).Item?.receivedCents,0);
  assert.equal((await payment(id))?.status,'REFUNDED');
  await completePayment(record,captureId);
  assert.equal((await funding()).Item?.receivedCents,0);
  await assert.rejects(()=>database.send(new DescribeTableCommand({TableName:'FoodLab-dev'})),error=>error instanceof Error&&error.name==='AccessDeniedException');
 }finally{await Promise.all(keys.map(Key=>database.send(new DeleteCommand({TableName,Key}))));}
});
