import 'server-only';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
export const tableName=process.env.DYNAMODB_TABLE_NAME;
export const database=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.AWS_REGION??'us-east-1'}),{marshallOptions:{removeUndefinedValues:true}});
export function requireTable(){if(!tableName)throw new Error('Configure DYNAMODB_TABLE_NAME.');return tableName;}
