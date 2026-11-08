import "dotenv/config";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Hostel } from "../src/models/Hostel.js";
import { SystemSetting } from "../src/models/SystemSetting.js";
import { ROLES } from "../src/constants/roles.js";

const FIXED = {
  admin: { email: "admin@gmail.com", password: "admin@123", name: "Mess Admin (Super)" },
  mess_committee: { email: "mess.secretary@gmail.com", password: "secretary@123", name: "Mess Secretary" },
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
    console.log("  = " + role.padEnd(16) + " " + email.padEnd(28) + " / " + password);
    return existing;
  }
  await User.create({ name, email: email.toLowerCase(), passwordHash, role, status: "active" });
  console.log("  + " + role.padEnd(16) + " " + email.padEnd(28) + " / " + password);
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
  await connectDB();

  console.log("\n[seed] hostels:");
  await upsertHostel("Aravali Hostel", "ARV", "male");
  await upsertHostel("Nilgiri Hostel", "NIL", "male");
  await upsertHostel("Vindhya Hostel", "VIN", "female");
  await upsertHostel("Shivalik Hostel", "SHI", "female");

  console.log("\n[seed] FIXED privileged accounts:");
  await upsertFixed({ role: ROLES.ADMIN, ...FIXED.admin });
  await upsertFixed({ role: ROLES.MESS_COMMITTEE, ...FIXED.mess_committee });
  await upsertFixed({ role: ROLES.STAFF, ...FIXED.staff });

  console.log("\n[seed] demo student:");
  const existingStudent = await User.findOne({ email: "rahul.sharma@iiit-bh.ac.in" });
  if (!existingStudent) {
    const hostel = await Hostel.findOne({ code: "ARV" });
    await User.create({
      name: "Rahul Sharma",
      email: "rahul.sharma@iiit-bh.ac.in",
      passwordHash: await User.hashPassword("Student@123"),
      role: ROLES.STUDENT, status: "active",
      studentId: "IIITB2023001", hostel: hostel._id, roomNumber: "A-101", semester: 4
    });
    console.log("  + student rahul.sharma@iiit-bh.ac.in / Student@123");
  } else {
    console.log("  = student rahul.sharma@iiit-bh.ac.in");
  }

  console.log("\n[seed] settings:");
  await upsertSetting("billing.monthlyFee", 4500, "billing", "Monthly base fee");
  await upsertSetting("billing.perMealPrice", { breakfast: 40, lunch: 80, snacks: 30, dinner: 90 }, "billing", "Per-meal");
  await upsertSetting("billing.guestMealPrice", 150, "billing", "Guest meal");
  await upsertSetting("meals.registrationCutoffMinutes", 120, "meals", "Reg cutoff");
  await upsertSetting("meals.cancellationCutoffMinutes", 60, "meals", "Cancel cutoff");
  await upsertSetting("leave.maxAdvanceDays", 30, "leave", "Adv leave days");
  await upsertSetting("attendance.qrTtlMinutes", 10, "attendance", "QR TTL");
  await upsertSetting("groundFloor.fee", 25000, "billing", "Ground floor semester fee (INR)");
  await upsertSetting("semester.name", "Current Semester", "general", "Semester name");
  await upsertSetting("semester.startDate", new Date().toISOString().slice(0, 10), "general", "Semester start");
  await upsertSetting("semester.endDate", new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), "general", "Semester end");

  console.log("\n=========================================");
  console.log("  NEW LOGINS (save these!)");
  console.log("=========================================");
  console.log("  ADMIN (super):  admin@gmail.com          / admin@123");
  console.log("  MESS SECRETARY: mess.secretary@gmail.com / secretary@123");
  console.log("  STAFF:          staff@gmail.com          / staff@123");
  console.log("  STUDENT:        rahul.sharma@iiit-bh.ac.in / Student@123");
  console.log("=========================================\n");

  await disconnectDB();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });