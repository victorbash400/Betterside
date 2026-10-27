import { loadCatalogue } from '../../server/catalogue';
import { apiError } from '../../server/http';
export async function GET(){try{return Response.json({issues:await loadCatalogue()},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiError(error,503);}}
