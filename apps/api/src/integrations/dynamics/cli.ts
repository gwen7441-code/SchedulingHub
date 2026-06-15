import { config } from "dotenv";
import { DynamicsMappingService } from "./dynamics-mapping.service.js";

config({ path: ".env" });

const [command, subcommand] = process.argv.slice(2);
const mapping = new DynamicsMappingService();

async function main() {
  if (command === "validate") {
    const report = {
      environment: {
        enabled: process.env.DYNAMICS_ENABLED === "true",
        tenantId: Boolean(process.env.DYNAMICS_TENANT_ID),
        clientId: Boolean(process.env.DYNAMICS_CLIENT_ID),
        orgUrl: Boolean(process.env.DYNAMICS_ORG_URL),
        authMethod: process.env.DYNAMICS_CLIENT_SECRET ? "client_secret" : process.env.DYNAMICS_CERTIFICATE_PATH ? "certificate" : "missing"
      },
      mapping: mapping.validate()
    };
    console.log(JSON.stringify(report, null, 2));
    if (process.env.DYNAMICS_ENABLED === "true" && (!report.mapping.ok || report.environment.authMethod === "missing")) process.exit(1);
    return;
  }

  if (command === "test-write") {
    if (!process.argv.includes("--confirm-sandbox-write")) {
      console.error("Refusing write test without --confirm-sandbox-write.");
      process.exit(1);
    }
    console.log("Write-test hook is ready. Configure a sandbox test record before enabling this in production.");
    return;
  }

  if (command === "sync") {
    console.log(`Requested Dynamics sync for ${subcommand ?? "all"}. Run the API/worker stack to process sync jobs.`);
    return;
  }

  console.error("Usage: dynamics <validate|test-write|sync>");
  process.exit(1);
}

main();
