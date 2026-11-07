import "dotenv/config";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Hostel } from "../src/models/Hostel.js";
import { SystemSetting } from "../src/models/SystemSetting.js";
import { ROLES } from "../src/constants/roles.js";

const FIXED = {
  warden: { email: "warden@gmail.com", password: "warden@123", name: "Chief Warden" },
  admin: { email: "admin@gmail.com", password: "admin@123", name: "Mess Administrator" },
  staff: { email: "staff@gmail.com", password: "staff@123", name: "Kitchen Staff" }
};

async function upsertFixed({ role, name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  const passwordHash = await User.hashPassword(password);
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = role;
    existing.status = "active";
    existing.name = name;
    await existing.save();
    console.log("  = " + role.padEnd(10) + " " + email.padEnd(22) + " / " + password + "  (reset)");
    return existing;
  }
  const u = await User.create({
    name, email: email.toLowerCase(), passwordHash, role, status: "active"
  });
  console.log("  + " + role.padEnd(10) + " " + email.padEnd(22) + " / " + password);
  return u;
}

async function upsertHostel(name, code, gender) {
  let h = await Hostel.findOne({ code });
  if (h) return h;
  return Hostel.create({ name, code, gender });
}

async function upsertSetting(key, value, category, description) {
  let s = await SystemSetting.findOne({ key });
  if (s) return s;
  return SystemSetting.create({ key, value, category, description });
}

async function main() {
  console.log("[seed] connecting...");
  await connectDB();

  console.log("\n[seed] hostels:");
  await upsertHostel("Aravali Hostel", "ARV", "male");
  await upsertHostel("Nilgiri Hostel", "NIL", "male");
  await upsertHostel("Vindhya Hostel", "VIN", "female");
  await upsertHostel("Shivalik Hostel", "SHI", "female");

  console.log("\n[seed] FIXED privileged accounts (never change these):");
  await upsertFixed({ role: ROLES.WARDEN, ...FIXED.warden });
  await upsertFixed({ role: ROLES.MESS_ADMIN, ...FIXED.admin });
  await upsertFixed({ role: ROLES.STAFF, ...FIXED.staff });

  console.log("\n[seed] demo student (active â€” can login now):");
  const existingStudent = await User.findOne({ email: "rahul.sharma@iiit-bh.ac.in" });
  if (!existingStudent) {
    const hostel = await Hostel.findOne({ code: "ARV" });
    await User.create({
      name: "Rahul Sharma",
      email: "rahul.sharma@iiit-bh.ac.in",
      passwordHash: await User.hashPassword("Student@123"),
      role: ROLES.STUDENT,
      status: "active",
      studentId: "IIITB2023001",
      hostel: hostel._id,
      roomNumber: "A-101",
      semester: 4
    });
    console.log("  + student    rahul.sharma@iiit-bh.ac.in / Student@123");
  } else {
    console.log("  = student    rahul.sharma@iiit-bh.ac.in (exists)");
  }

  console.log("\n[seed] settings:");
  await upsertSetting("billing.monthlyFee", 4500, "billing", "Monthly mess fee (INR)");
  await upsertSetting("billing.perMealPrice", { breakfast: 40, lunch: 80, snacks: 30, dinner: 90 }, "billing", "Per-meal price (INR)");
  await upsertSetting("billing.guestMealPrice", 150, "billing", "Guest meal price (INR)");
  await upsertSetting("meals.registrationCutoffMinutes", 120, "meals", "Registration closes N min before meal");
  await upsertSetting("meals.cancellationCutoffMinutes", 60, "meals", "Cancellation closes N min before meal");
  await upsertSetting("leave.maxAdvanceDays", 30, "leave", "Max days advance leave");
  await upsertSetting("attendance.qrTtlMinutes", 10, "attendance", "QR valid for N minutes");
  console.log("  + all settings ready");

  console.log("\n=========================================");
  console.log("  LOGIN CREDENTIALS (save these!)");
  console.log("=========================================");
  console.log("  WARDEN:  warden@gmail.com  / warden@123");
  console.log("  ADMIN:   admin@gmail.com   / admin@123");
  console.log("  STAFF:   staff@gmail.com   / staff@123");
  console.log("  STUDENT: rahul.sharma@iiit-bh.ac.in / Student@123");
  console.log("=========================================\n");

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });