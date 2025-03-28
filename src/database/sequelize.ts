/** @format */

import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import AdminModel from "../domain/auth/models/admin.model";
import bcrypt from "bcrypt";

dotenv.config();

const createSuperAdmin = async () => {
  const username = process.env.SUPER_ADMIN_USERNAME;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME;

  if (!username || !password || !name) {
    console.warn("Super admin ma'lumotlari .env faylda to‘liq ko‘rsatilmagan!");
    return;
  }

  if (!process.env.BCRYPT_SALT) {
    throw new Error("BCRYPT_SALT is not defined in environment variables");
  }

  const existing: AdminModel | null = await AdminModel.findOne({
    where: { username },
  });

  if (!existing) {
    const hashedPassword: string = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT),
    );
    await AdminModel.create({
      username,
      password: hashedPassword,
      name,
      isSuperAdmin: true,
    });

    console.log("🔑 Super admin foydalanuvchisi yaratildi!");
  } else {
    console.log("ℹ️ Super admin allaqachon mavjud.");
  }
};

const psql = async () => {
  const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING as string, {
    logging: false,
    models: [
      __dirname + "/../**/**/*.model.ts",
      __dirname + "/../**/**/*.model.js",
    ],
  });

  const schemas: string[] = ["Auth", "File", "sms"];

  for (const schema of schemas) {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  }

  try {
    await sequelize.authenticate();
    console.log("PostgreSQL bilan muvaffaqiyatli ulanildi!");
  } catch (error) {
    console.log("PostgreSQL bilan bog'lanishda xatolik:", error);
  }

  await sequelize.sync({
    alter: true,
  });

  await createSuperAdmin();

  return sequelize;
};

export default psql;
