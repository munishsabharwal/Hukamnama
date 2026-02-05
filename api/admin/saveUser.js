
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database('hukamdb');
const users = db.container('Users');

export async function POST(req, ctx){
  try {
    const { email, role, gurudwaraCodes } = await req.json();
    if(!email || !role) return { status: 400, body: 'email and role required' };
    const item = { id: email, displayName: email, roles: [role], gurudwaraCodes: gurudwaraCodes || [], invitedAt: new Date().toISOString() };
    await users.items.upsert(item);
    return { status: 200, body: 'Saved' };
  } catch (e){ ctx.log('saveUser error', e); return { status: 500, body: 'Error saving user' }; }
}
