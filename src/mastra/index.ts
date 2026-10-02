import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from "@mastra/core/storage";
import {
  MastraStorageExporter,
  Observability,
  SensitiveDataFilter,
} from "@mastra/observability";
import { agent } from "./agents/agent";
import { startScheduleTool, stopScheduleTool } from "./tools/schedule-tools";

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

const storage = new LibSQLStore(
  tursoDatabaseUrl && tursoAuthToken
    ? {
        id: "mastra-storage",
        url: tursoDatabaseUrl,
        authToken: tursoAuthToken,
      }
    : {
        id: "mastra-storage",
        url: ":memory:",
      },
);

export const mastra = new Mastra({
  bundler: {
    externals: ["@duckdb/node-bindings"],
  },
  agents: { agent },
  tools: { startScheduleTool, stopScheduleTool },
  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: storage,
    domains: {
      observability: await new DuckDBStore().getStore("observability"),
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new MastraStorageExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
