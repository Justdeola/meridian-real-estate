import { getSql, type Sql } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

const globalRef = globalThis as typeof globalThis & {
  __meridianSeed__?: Promise<void>;
};

export async function withDb(): Promise<Sql> {
  const sql = await getSql();
  globalRef.__meridianSeed__ ??= seedIfEmpty(sql).catch((err) => {
    globalRef.__meridianSeed__ = undefined;
    throw err;
  });
  await globalRef.__meridianSeed__;
  return sql;
}
