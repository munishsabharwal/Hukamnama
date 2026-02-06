import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database("hukamdb");
const daily = db.container("DailyPublications");
const library = db.container("HukamLibrary");

async function handler(request, context) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const g = url.searchParams.get("gurudwara");

    const query = g
      ? {
          query: "SELECT * FROM c WHERE c.date=@d AND c.gurudwaraCode=@g",
          parameters: [{ name: "@d", value: date }, { name: "@g", value: g }],
        }
      : {
          query: "SELECT * FROM c WHERE c.date=@d",
          parameters: [{ name: "@d", value: date }],
        };

    const { resources } = await daily.items.query(query).fetchAll();

    const expanded = await Promise.all(
      resources.map(async (r) => {
        const hk = await library.item(r.hukamId, r.hukamId).read();
        return { ...r, hukam: hk.resource };
      })
    );

    return { status: 200, jsonBody: expanded };
  } catch (e) {
    context.error("getDaily error", e);
    return { status: 500, body: "Error fetching daily hukams" };
  }
}

app.http("hukams-getDaily", {
  route: "hukams/getDaily",
  methods: ["GET"],
  authLevel: "anonymous", // keep anonymous so homepage can load without login
  handler,
});
