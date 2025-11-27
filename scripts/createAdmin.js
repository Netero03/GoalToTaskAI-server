// scripts/createAdmin.js
/**
 * Run: npm run seed:create-admin
 * Make sure .env contains ADMIN_EMAIL and ADMIN_PASSWORD or set them in shell.
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';

async function createAdmin() {
  await connectToDatabase();
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Principal Admin';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    process.exit(0);
  }

  const user = new User({ name, email, password, role: 'principal' });
  await user.save();
  console.log('Created admin user:', { email, name, id: user._id.toString() });
  process.exit(0);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
