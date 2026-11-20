import { prisma } from "./data/db.js";
import { markShelvesReady } from "./ready.js";
import { seedReadingRoom } from "./data/seed.js";

// The schema is no longer pushed at startup (the host cannot spawn `npx prisma`).
// Apply it once from your machine with `npm run db:push --prefix server`.
export async function openShelves(): Promise<void> {
  const titles = await prisma.title.count();
  if (titles >= 200) {
    // The catalog is already in the database: start answering requests now.
    // Refreshing the desk account means hashing its password, which takes a long
    // time on Wasmer's QuickJS engine, so it runs in the background instead of
    // keeping every visitor waiting after the app wakes up.
    markShelvesReady();
    console.log(`Shelves are open (${titles} titles).`);
    void seedReadingRoom().catch((error) => {
      console.error("Could not refresh the seeded accounts.", error);
    });
    return;
  }

  // First start on an empty database: fill the catalog before opening.
  await seedReadingRoom();
  markShelvesReady();
  console.log("Shelves are open.");
}
