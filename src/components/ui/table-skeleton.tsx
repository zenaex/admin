"use client";

import type { ReactNode } from "react";

export type TableSkeletonCellVariant =
  | "text"
  | "text-wide"
  | "text-narrow"
  | "avatar"
  | "badge"
  | "icon";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200/80 ${className ?? ""}`} aria-hidden />;
}

function SkeletonCell({ variant = "text" }: { variant?: TableSkeletonCellVariant }) {
  switch (variant) {
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <SkeletonBar className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <SkeletonBar className="h-3.5 w-28 max-w-full" />
            <SkeletonBar className="h-3 w-20 max-w-full" />
          </div>
        </div>
      );
    case "badge":
      return <SkeletonBar className="h-6 w-20 rounded-full" />;
    case "icon":
      return <SkeletonBar className="h-8 w-8 rounded-lg" />;
    case "text-wide":
      return <SkeletonBar className="h-4 w-40 max-w-full" />;
    case "text-narrow":
      return <SkeletonBar className="h-4 w-20 max-w-full" />;
    default:
      return <SkeletonBar className="h-4 w-32 max-w-full" />;
  }
}

type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
  cellVariants?: TableSkeletonCellVariant[];
  rowHeightClass?: string;
  cellClassName?: string;
};

export function TableSkeletonRows({
  columns,
  rows = 8,
  cellVariants,
  rowHeightClass = "h-16",
  cellClassName = "border-b border-zinc-100 px-4 py-0 align-middle",
}: TableSkeletonRowsProps) {
  const variants =
    cellVariants ??
    Array.from({ length: columns }, () => "text" as TableSkeletonCellVariant);

  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={`table-skeleton-row-${rowIndex}`} className="border-b border-zinc-100" aria-hidden>
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={`table-skeleton-cell-${rowIndex}-${colIndex}`} className={`${rowHeightClass} ${cellClassName}`}>
              <SkeletonCell variant={variants[colIndex] ?? "text"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

type TableSkeletonProps = {
  columns: number;
  rows?: number;
  headers?: string[];
  cellVariants?: TableSkeletonCellVariant[];
  className?: string;
  tableClassName?: string;
  headerRowClassName?: string;
  headerCellClassName?: string;
  rowHeightClass?: string;
  cellClassName?: string;
  children?: ReactNode;
};

export function TableSkeleton({
  columns,
  rows = 8,
  headers,
  cellVariants,
  className = "mt-4 overflow-x-auto rounded-[8px]",
  tableClassName = "w-full border-collapse bg-white text-left text-sm",
  headerRowClassName = "bg-zinc-50 text-xs text-zinc-400",
  headerCellClassName = "h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle",
  rowHeightClass,
  cellClassName,
  children,
}: TableSkeletonProps) {
  const colCount = headers?.length ?? columns;

  return (
    <div className={className} role="status" aria-busy="true" aria-label="Loading table data">
      <table className={tableClassName}>
        {headers ? (
          <thead>
            <tr className={headerRowClassName}>
              {headers.map((header) => (
                <th key={header} className={headerCellClassName}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {children ?? (
            <TableSkeletonRows
              columns={colCount}
              rows={rows}
              cellVariants={cellVariants}
              rowHeightClass={rowHeightClass}
              cellClassName={cellClassName}
            />
          )}
        </tbody>
      </table>
      <span className="sr-only">Loading table data</span>
    </div>
  );
}
