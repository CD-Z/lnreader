/**
 * Test-specific dbManager implementation for better-sqlite3
 * Provides compatibility with op-sqlite specific methods
 */

import type { IDbManager } from '@database/manager/manager.d';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Placeholder, sql } from 'drizzle-orm';
import { SQLitePreparedQuery } from 'drizzle-orm/sqlite-core';

interface ExecutableSelect<TResult = any> {
  toSQL(): { sql: string; params: unknown[] };
  get(): Promise<TResult | undefined>;
  all(): Promise<TResult[]>;
}

type DrizzleDb = BetterSQLite3Database<any>;
type TransactionParameter = Parameters<
  Parameters<DrizzleDb['transaction']>[0]
>[0];

const isBuilderLike = (value: unknown): value is Record<string, unknown> => {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { get?: unknown }).get === 'function' &&
    typeof (value as { all?: unknown }).all === 'function'
  );
};

const wrapBuilder = <T extends object>(builder: T): T => {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'get' && typeof value === 'function') {
        return (...args: unknown[]) =>
          Promise.resolve(value.apply(target, args as never[]));
      }
      if (prop === 'all' && typeof value === 'function') {
        return (...args: unknown[]) =>
          Promise.resolve(value.apply(target, args as never[]));
      }
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = value.apply(target, args as never[]);
          return isBuilderLike(result) ? wrapBuilder(result as object) : result;
        };
      }
      return value;
    },
  });
};

/**
 * Creates a test-compatible dbManager that works with better-sqlite3
 */
export function createTestDbManager(
  drizzleDb: DrizzleDb,
  sqlite: Database.Database,
): IDbManager {
  // Create a wrapper that implements the IDbManager interface
  const dbManager = {
    // Drizzle methods - delegate to drizzleDb
    select: (...args: Parameters<DrizzleDb['select']>) =>
      wrapBuilder(drizzleDb.select(...args)),
    selectDistinct: (...args: Parameters<DrizzleDb['selectDistinct']>) =>
      wrapBuilder(drizzleDb.selectDistinct(...args)),
    $count: drizzleDb.$count.bind(drizzleDb),
    query: drizzleDb.query,
    run: drizzleDb.run.bind(drizzleDb),
    with: (...args: Parameters<DrizzleDb['with']>) =>
      wrapBuilder(drizzleDb.with(...args)),
    $with: (...args: Parameters<DrizzleDb['$with']>) =>
      wrapBuilder(drizzleDb.$with(...args)),
    all: (...args: Parameters<DrizzleDb['all']>) =>
      Promise.resolve(drizzleDb.all(...args)),
    get: (...args: Parameters<DrizzleDb['get']>) =>
      Promise.resolve(drizzleDb.get(...args)),
    values: (...args: Parameters<DrizzleDb['values']>) =>
      Promise.resolve(drizzleDb.values(...args)),

    // Test-compatible implementations of op-sqlite specific methods
    getSync<T extends ExecutableSelect>(
      query: T,
    ): Awaited<ReturnType<T['get']>> {
      const { sql, params } = query.toSQL();
      const stmt = sqlite.prepare(sql);
      const result = stmt.get(params as any[]) as Awaited<ReturnType<T['get']>>;
      return result;
    },

    async allSync<T extends ExecutableSelect>(
      query: T,
    ): Promise<Awaited<ReturnType<T['all']>>> {
      const { sql, params } = query.toSQL();
      const stmt = sqlite.prepare(sql);
      const results = stmt.all(params as any[]) as Awaited<
        ReturnType<T['all']>
      >;
      return results;
    },

    async batch<T extends Record<string, unknown>>(
      data: T[],
      fn: (
        tx: TransactionParameter,
        ph: (arg: Extract<keyof T, string>) => Placeholder,
      ) => SQLitePreparedQuery<any>,
    ) {
      const ph = (arg: Extract<keyof T, string>) => sql.placeholder(arg);
      await this.write(async tx => {
        const prep = fn(tx, ph);
        for (let index = 0; index < data.length; index++) {
          prep.run(data[index]);
        }
      });
    },

    // better-sqlite3 can't handle an async transaction function
    async write<T>(fn: (tx: TransactionParameter) => Promise<T>): Promise<T> {
      const result = await fn(drizzleDb as any);

      return result;
    },
    async transaction<T>(
      fn: (tx: TransactionParameter) => Promise<T>,
    ): Promise<T> {
      return await this.write(fn);
    },
  };

  return dbManager;
}
