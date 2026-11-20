import { markShelvesReady } from "./ready.js";
import { seedReadingRoom } from "./data/seed.js";

// The schema is no longer pushed at startup (the host cannot spawn `npx prisma`).
// Apply it once from your machine with `npm run db:push --prefix server`.
export async function openShelves(): Promise<void> {
  await seedReadingRoom();
  markShelvesReady();
  console.log("Shelves are open.");
}
