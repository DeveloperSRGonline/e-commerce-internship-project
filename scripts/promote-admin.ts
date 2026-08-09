import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { connectToDB } from "../lib/db/connect";
import User from "../models/User.model";

async function makeAdmin() {
  await connectToDB();
  const email = process.argv[2] || "shivamgarade05@gmail.com";
  
  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`✅ Promoted user "${email}" to admin role!`);
  } else {
    console.log(`❌ User "${email}" not found in database.`);
  }
  process.exit(0);
}

makeAdmin();
