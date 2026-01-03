import { openWzDb } from "../../../../../classification/src/resolver/db";
import { WzResolver } from "../../../../../classification/src/resolver/wzResolver";
import { aggregateAssessments } from "../../../../../classification/src/resolver/aggregateAssessments";
import type { Assessment } from "../../../../../classification/src/resolver/types";

export type ClassificationActivityInput = {
  text?: string;
  tags?: string[];
  wzCode?: string;
};

export function classifyActivities(
  activities: ClassificationActivityInput[]
) {
  // 🔥 KEIN Pfad übergeben – Default aus db.ts verwenden
  const { db, close } = openWzDb();

  try {
    const resolver = new WzResolver(db);
    const assessments: Assessment[] = activities.map((a) =>
      resolver.assess(a)
    );
    return aggregateAssessments(assessments);
  } finally {
    close();
  }
}
