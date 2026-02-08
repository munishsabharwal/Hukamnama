import { app } from "@azure/functions";

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => ({
    jsonBody: { ok: true, ts: new Date().toISOString(), runtime: "node20" }
  })
});
