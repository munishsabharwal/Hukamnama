
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database('hukamdb');
const library = db.container('HukamLibrary');

export async function GET(req, ctx){
  try {
    const { resources } = await library.items.query({ query: 'SELECT * FROM c ORDER BY c.id' }).fetchAll();
    return { jsonBody: resources, status: 200 };
  } catch (e){
    ctx.log('getLibrary error', e);
    return { status: 500, body: 'Error fetching library' };
  }
}
