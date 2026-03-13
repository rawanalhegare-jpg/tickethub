import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuf = Buffer.from(hash, "hex");
    const inputHash = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuf, inputHash);
  } catch {
    return false;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    displayName: string;
  }
}
