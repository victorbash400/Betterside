import 'server-only';
import { Agent } from 'node:https';
import { awsLookup } from './aws-dns.ts';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
export const tableName=process.env.DYNAMODB_TABLE_NAME;
export const database=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.AWS_REGION??'us-east-1',maxAttempts:1,requestHandler:{connectionTimeout:10000,requestTimeout:15000,throwOnRequestTimeout:true,httpsAgent:new Agent({keepAlive:true,lookup:awsLookup})}}),{marshallOptions:{removeUndefinedValues:true}});
export function requireTable(){if(!tableName)throw new Error('Configure DYNAMODB_TABLE_NAME.');return tableName;}
