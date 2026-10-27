import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { issues } from '../../lib/catalogue';
import { database, requireTable } from '../../server/aws';
import { apiError } from '../../server/http';
export async function GET(){try{const result=await database.send(new BatchGetCommand({RequestItems:{[requireTable()]:{Keys:issues.map(issue=>({pk:`PROJECT#${issue.project.id}`,sk:'FUNDING'})),ConsistentRead:true}}}));if(Object.keys(result.UnprocessedKeys??{}).length)throw new Error('Funding records unavailable. Retry.');const totals=result.Responses?.[requireTable()]??[];return Response.json({issues:issues.map(issue=>({...issue,project:{...issue.project,raised:(totals.find(item=>item.pk===`PROJECT#${issue.project.id}`)?.receivedCents??0)/100}}))},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiError(error,503);}}
