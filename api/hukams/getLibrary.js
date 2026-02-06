import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_CONN);
const db = client.database("hukamdb");
const library = db.container("HukamLibrary");

async function handler(request, context) {
  try {
    const { resources } = await library.items
      .query({ query: "SELECT * FROM c ORDER BY c.id" })
      .fetchAll();

    return { status: 200, jsonBody: resources };
  } catch (e) {
    context.error("getLibrary error", e);
    return { status: 500, body: "Error fetching library" };
  }
}

app.http("hukams-getLibrary", {
  route: "hukams/getLibrary",
  methods: ["GET"],
  authLevel: "anonymous",
  handler,
});

