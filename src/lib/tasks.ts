import { makePool, type TaskPool } from "~/lib/game/deck";
import type { L10n, TaskRecord } from "~/lib/game/types";

export async function fetchTaskPool(): Promise<TaskPool> {
  const res = await fetch("/data/tasks.json");
  if (!res.ok) throw new Error(`tasks.json ${res.status}`);
  const tasks = (await res.json()) as TaskRecord[];
  return makePool(tasks);
}

const statementCache = new Map<string, Promise<Record<string, string>>>();

/** English translations are lazy-loaded per exam. */
export function fetchStatements(exam: string): Promise<Record<string, string>> {
  let p = statementCache.get(exam);
  if (!p) {
    p = fetch(`/data/statements/${exam}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {}))
      .catch(() => ({}));
    statementCache.set(exam, p);
  }
  return p;
}

const SESSION_NAME: Record<string, L10n> = {
  maj: { pl: "maj", en: "May" },
  czerwiec: { pl: "czerwiec (dodatkowa)", en: "June (additional)" },
  sierpien: { pl: "sierpień (poprawkowa)", en: "August (resit)" },
  probna: { pl: "próbna", en: "mock" },
  diagnostyczna: { pl: "diagnostyczna", en: "diagnostic" },
  pokazowa: { pl: "pokazowa", en: "sample" },
  zimowa: { pl: "zimowa", en: "winter" },
};

export function sessionName(session: string): L10n {
  return SESSION_NAME[session] ?? { pl: session, en: session };
}
