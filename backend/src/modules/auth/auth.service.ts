import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db";
import { env } from "../../config/env";

const SALT_ROUNDS = 10;

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
}

export async function register(email: string, password: string, displayName?: string): Promise<UserRow> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *`,
    [email, passwordHash, displayName ?? null],
  );
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0];
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0];
}

export async function verifyPassword(user: UserRow, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export function issueToken(user: UserRow): string {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: "7d" });
}
