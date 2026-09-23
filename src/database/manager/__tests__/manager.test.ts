import {
  createTestDb,
  cleanupTestDb,
} from '@database/queries/__tests__/testDb';

describe('DbManager.executeBatch', () => {
  const testDb = createTestDb();

  afterAll(() => {
    cleanupTestDb(testDb);
  });

  beforeEach(() => {
    testDb.sqlite.executeSync('DROP TABLE IF EXISTS BatchTest');
    testDb.sqlite.executeSync(
      'CREATE TABLE BatchTest (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT NOT NULL)',
    );
  });

  it('executes heterogeneous and repeated-parameter commands atomically', async () => {
    const result = await testDb.dbManager.executeBatch([
      ['INSERT INTO BatchTest (value) VALUES (?)', [['first'], ['second']]],
      ['UPDATE BatchTest SET value = ? WHERE value = ?', ['updated', 'first']],
      ['DELETE FROM BatchTest WHERE value = ?', [['second']]],
    ]);

    expect(result.rowsAffected).toBe(4);
    expect(
      testDb.sqlite.executeSync('SELECT value FROM BatchTest').rows,
    ).toEqual([{ value: 'updated' }]);
  });

  it('rolls back every command when a later command fails', async () => {
    await expect(
      testDb.dbManager.executeBatch([
        ['INSERT INTO BatchTest (value) VALUES (?)', [['rolled back']]],
        ['INSERT INTO MissingBatchTable (value) VALUES (?)', [['failure']]],
      ]),
    ).rejects.toThrow();

    expect(testDb.sqlite.executeSync('SELECT * FROM BatchTest').rows).toEqual(
      [],
    );
  });
});
