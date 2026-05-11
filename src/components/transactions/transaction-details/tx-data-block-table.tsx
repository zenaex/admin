import type { ReactNode } from "react";

export const BORDER = "#EEEEEE";
export const HEADER_BG = "#F9F9F9";
export const TEXT = "#333333";
export const LINK = "#4A6FA5";

export function TxDataBlockTable({
  headers,
  row,
  className = "",
  collapseTopBorder = false,
}: {
  headers: string[];
  row: ReactNode[];
  className?: string;
  collapseTopBorder?: boolean;
}) {
  const cellBorder = `1px solid ${BORDER}`;
  const thBase = "px-4 py-3 text-left text-xs font-semibold align-middle";
  const tdBase = "px-4 py-4 text-left text-sm font-normal align-top";
  const n = headers.length;

  return (
    <div className={["w-full overflow-hidden rounded-xl bg-white", className].filter(Boolean).join(" ")}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ backgroundColor: HEADER_BG }}>
            {headers.map((h, i) => (
              <th
                key={h}
                className={[
                  thBase,
                  !collapseTopBorder && i === 0 ? "rounded-tl-xl" : "",
                  !collapseTopBorder && i === n - 1 ? "rounded-tr-xl" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  color: TEXT,
                  borderBottom: cellBorder,
                  borderRight: i < n - 1 ? cellBorder : "none",
                  borderTop: collapseTopBorder ? "none" : cellBorder,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            {row.map((cell, i) => (
              <td
                key={i}
                className={[
                  tdBase,
                  i === 0 ? "rounded-bl-xl" : "",
                  i === n - 1 ? "rounded-br-xl" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  color: TEXT,
                  borderBottom: cellBorder,
                  borderRight: i < n - 1 ? cellBorder : "none",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
