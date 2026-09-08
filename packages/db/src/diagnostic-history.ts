import { desc, eq } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export const diagnosticHistory = sqliteTable(
  'diagnostic_history',
  {
    id: text('id').primaryKey(),
    project: text('project').notNull(),
    diagnosedAt: text('diagnosed_at').notNull(),
    savedAt: text('saved_at').notNull(),
    evaluation: text('evaluation').notNull(),
    candidateCount: integer('candidate_count').notNull(),
    resultJson: text('result_json').notNull(),
  },
  (table) => [index('diagnostic_history_saved_at').on(table.savedAt, table.id)],
);

export type DiagnosticHistoryRow = typeof diagnosticHistory.$inferSelect;
// Explicit selections keep the large snapshot out of history list responses.
const columns = {
  id: diagnosticHistory.id,
  project: diagnosticHistory.project,
  diagnosedAt: diagnosticHistory.diagnosedAt,
  savedAt: diagnosticHistory.savedAt,
  evaluation: diagnosticHistory.evaluation,
  candidateCount: diagnosticHistory.candidateCount,
};

export function diagnosticHistoryStore(db: DrizzleD1Database) {
  return {
    async save(row: DiagnosticHistoryRow) {
      await db.insert(diagnosticHistory).values(row).onConflictDoNothing();
      return this.get(row.id);
    },
    get: (id: string) =>
      db.select().from(diagnosticHistory).where(eq(diagnosticHistory.id, id)).get(),
    list: (offset: number) =>
      db
        .select(columns)
        .from(diagnosticHistory)
        .orderBy(desc(diagnosticHistory.savedAt), desc(diagnosticHistory.id))
        .limit(21)
        .offset(offset)
        .all(),
    async remove(id: string) {
      const removed = await db
        .delete(diagnosticHistory)
        .where(eq(diagnosticHistory.id, id))
        .returning({ id: diagnosticHistory.id });
      return removed.length > 0;
    },
  };
}
