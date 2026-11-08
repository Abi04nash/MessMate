import "dotenv/config";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { ROLE_ALIASES } from "../src/constants/roles.js";

async function main() {
  console.log("[migrate] connecting...");
  await connectDB();

  let total = 0;
  for (const [oldRole, newRole] of Object.entries(ROLE_ALIASES)) {
    const count = await User.countDocuments({ role: oldRole });
    if (count > 0) {
      const result = await User.updateMany({ role: oldRole }, { $set: { role: newRole } });
      console.log(`  ${oldRole} -> ${newRole}: ${result.modifiedCount} users updated`);
      total += result.modifiedCount;
    } else {
      console.log(`  ${oldRole}: 0 users (already migrated)`);
    }
  }

  console.log(`[migrate] done. ${total} users migrated.`);
  await disconnectDB();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });