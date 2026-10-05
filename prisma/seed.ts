import { ensureDemoData } from "../lib/seed";

async function main() {
  await ensureDemoData();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
