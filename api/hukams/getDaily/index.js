import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const conn = process.env.COSMOS_CONN;

app.http("hukams-getDaily", {
  route: "hukams/getDaily",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const gurudwara = url.searchParams.get("gurudwara") || null;

    if (!conn) {
      context.error("Missing COSMOS_CONN app setting");
      return { status: 500, jsonBody: { error: "Server misconfigured: COSMOS_CONN missing" } };
    }

    try {
      const client = new CosmosClient(conn);
      const db = client.database("DailyHukamDB");

      // Exact container names:
      const daily = db.container("DailyPublications");
      const library = db.container("Hukam Library"); // <-- space here

      // Fail fast if containers are wrong/inaccessible
      await Promise.all([daily.read(), library.read()]);

      const query = gurudwara
        ? {
            query: "SELECT * FROM c WHERE c.date = @d AND c.gurudwaraCode = @g",
            parameters: [
              { name: "@d", value: date },
              { name: "@g", value: gurudwara }
            ]
          }
        : {
            query: "SELECT * FROM c WHERE c.date = @d",
            parameters: [{ name: "@d", value: date }]
          };

      context.log("getDaily query", { date, gurudwara });

      const { resources } = await daily.items.query(query).fetchAll();

      // If Hukam Library PK is /id, the following is correct; if not, adjust pk value accordingly.
      const expanded = await Promise.all(
        (resources || []).map(async (r) => {
          try {
            const { resource: hk } = await library.item(r.hukamId, r.hukamId).read();
            return { ...r, hukam: hk ?? null };
          } catch (readErr) {
            context.error("Hukam Library read failed", { hukamId: r.hukamId, message: readErr.message });
            return { ...r, hukam: null, hukamReadError: readErr.message };
          }
        })
      );

      return { status: 200, jsonBody: expanded };
    } catch (e) {
      const msg = e?.message || "Unknown error";
      const code = e?.code || e?.statusCode || "ERR";
      context.error("getDaily error", msg);
      return { status: 500, jsonBody: { error: "Error fetching daily hukams", code, message: msg } };
    }
  }
});
