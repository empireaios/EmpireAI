import { asArray, asRecord, asString } from "@/lib/empire-data";

type Props = {
  board: Record<string, unknown> | null;
};

export function GlobalOpportunityBoardPanel({ board }: Props) {
  if (!board) return null;

  const summary = asString(board.summary);
  const items = asArray(board.items).slice(0, 8);

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Global Opportunity Board (REAL-084)</p>
      <p className="empireMetricHint">{summary}</p>
      <ul className="empireList" style={{ marginTop: "0.75rem" }}>
        {items.map((raw, i) => {
          const item = asRecord(raw);
          return (
            <li key={asString(item?.itemId, `opp-${i}`)}>
              <strong>{asString(item?.label, "Opportunity")}</strong>
              <span className="empireMetricHint"> · {asString(item?.status)} · {asString(item?.recommendation)?.slice(0, 100)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
