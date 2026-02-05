
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database('hukamdb');
const daily = db.container('DailyPublications');

export async function POST(req, ctx){
  try {
    const body = await req.json();
    const { hukamId, date, gurudwaraCode } = body || {};
    if(!hukamId || !date || !gurudwaraCode){
      return { status: 400, body: 'hukamId, date, gurudwaraCode required' };
    }
    const principalHeader = req.headers.get('x-ms-client-principal');
    const principal = principalHeader ? JSON.parse(Buffer.from(principalHeader, 'base64').toString('utf8')) : null;
    const userId = principal?.userDetails || 'unknown';
    const nameClaim = principal?.userClaims?.find(c=>c.typ==='name')?.val;
    const id = `${gurudwaraCode}-${date}`;

    await daily.items.upsert({ id, date, gurudwaraCode, hukamId, publishedBy: { userId, displayName: nameClaim || userId }, publishedAt: new Date().toISOString() });
    return { status: 200, body: 'Published' };
  } catch (e){
    ctx.log('publishDaily error', e);
    return { status: 500, body: 'Error publishing' };
  }
}
