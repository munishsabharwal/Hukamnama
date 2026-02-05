
// /api/getRoles — returns roles for the signed-in user using Cosmos DB Users container
// This function is designed to be called by SWA auth.rolesSource (POST on sign-in)
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database('hukamdb');
const users = db.container('Users');

export async function POST(request, context){
  try {
    const body = await request.json();
    // body may include: { identityProvider, userId, userDetails, claims[], accessToken }
    const email = body?.userDetails || body?.claims?.find(c=>c.typ==='emails')?.val;
    if(!email){
      return { jsonBody: { roles: [] } };
    }
    // look up user by id (email)
    const { resource } = await users.item(email, email).read().catch(()=>({}));
    const roles = resource?.roles || [];
    return { jsonBody: { roles } };
  } catch (e){
    context.log('getRoles error', e);
    return { jsonBody: { roles: [] } };
  }
}
