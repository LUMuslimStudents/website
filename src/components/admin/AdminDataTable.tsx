// AdminDataTable — reusable admin table with sorting, per-column filters,
// column visibility + drag reordering, CSV export, and optional custom cell
// renderers. Lifted from the event-details view so all admin tables share
// one layout and behavior.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ArrowUpDown, ChevronDown, ChevronUp, Columns3, Download, Filter, GripHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AdminDataColumn<T> = {
  id: string;
  label: string;
  fullLabel?: string;
  getSearchValue: (row: T) => string;
  getSortValue: (row: T) => string;
  getDisplayValue: (row: T) => string;
  /** Optional fully custom cell (e.g. action buttons, selects). */
  renderCell?: (row: T) => ReactNode;
  placeholder?: string;
  headerClassName?: string;
  cellClassName?: string;
};

type AdminDataTableProps<T> = {
  columns: AdminDataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  csvFileName: string;
  /** Columns that cannot be hidden or reordered (e.g. actions). */
  pinnedColumnIds?: string[];
  defaultSortColumnId?: string;
  getRowTint?: (row: T) => string;
  emptyMessage?: string;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
};

const truncateLabel = (value: string, max = 56) => {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
};

const normalizeText = (value?: string | null) => (value ?? "").toLowerCase().trim();

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

type DragContext = {
  originCenter: number;
  draggedWidth: number;
  originalMovableOrder: string[];
  originalIndex: number;
  contentLeft: number;
  centers: Record<string, number>;
};

export const AdminDataTable = <T,>({
  columns,
  rows,
  rowKey,
  csvFileName,
  pinnedColumnIds = [],
  defaultSortColumnId,
  getRowTint,
  emptyMessage = "No rows matched the current column filters.",
  toolbarLeft,
  toolbarRight,
}: AdminDataTableProps<T>) => {
  const [sortColumnId, setSortColumnId] = useState<string>(
    defaultSortColumnId ?? columns[0]?.id ?? "",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [menuDraggedColumnId, setMenuDraggedColumnId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const bodyCellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const dragCtxRef = useRef<DragContext | null>(null);

  const ensurePinnedColumnsFirst = (columnIds: string[]) => {
    const withoutPinned = columnIds.filter((id) => !pinnedColumnIds.includes(id));
    return [...pinnedColumnIds, ...withoutPinned];
  };

  const allIds = useMemo(() => columns.map((column) => column.id), [columns]);

  useEffect(() => {
    if (allIds.length === 0) {
      return;
    }

    setColumnOrder((previous) => {
      if (previous.length === 0) {
        return ensurePinnedColumnsFirst(allIds);
      }

      const retained = previous.filter((id) => allIds.includes(id));
      const appended = allIds.filter((id) => !retained.includes(id));
      return ensurePinnedColumnsFirst([...retained, ...appended]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds]);

  useEffect(() => {
    if (allIds.length === 0) {
      return;
    }

    setVisibleColumnIds((previous) => {
      if (previous.length === 0) {
        return ensurePinnedColumnsFirst(allIds);
      }

      const retained = previous.filter((id) => allIds.includes(id));
      const appended = allIds.filter((id) => !retained.includes(id));
      const next = [...retained, ...appended];
      return ensurePinnedColumnsFirst(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds]);

  const orderedColumns = useMemo(() => {
    if (columns.length === 0) {
      return [] as AdminDataColumn<T>[];
    }

    const map = new Map(columns.map((column) => [column.id, column]));
    return columnOrder
      .map((id) => map.get(id))
      .filter((column): column is AdminDataColumn<T> => Boolean(column));
  }, [columns, columnOrder]);

  const visibleOrderedColumns = useMemo(
    () => orderedColumns.filter((column) => visibleColumnIds.includes(column.id)),
    [orderedColumns, visibleColumnIds],
  );

  useEffect(() => {
    if (visibleOrderedColumns.length === 0) {
      return;
    }

    if (!visibleOrderedColumns.some((column) => column.id === sortColumnId)) {
      setSortColumnId(visibleOrderedColumns[0].id);
      setSortDirection("asc");
    }
  }, [visibleOrderedColumns, sortColumnId]);

  const processedRows = useMemo(() => {
    if (visibleOrderedColumns.length === 0) {
      return [] as T[];
    }

    const filteredRows = rows.filter((row) =>
      visibleOrderedColumns.every((column) => {
        const filterValue = normalizeText(columnFilters[column.id]);
        if (!filterValue) {
          return true;
        }
        return normalizeText(column.getSearchValue(row)).includes(filterValue);
      }),
    );

    const activeSortColumn =
      visibleOrderedColumns.find((column) => column.id === sortColumnId) ||
      visibleOrderedColumns[0];

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeText(activeSortColumn.getSortValue(left));
      const rightValue = normalizeText(activeSortColumn.getSortValue(right));
      const comparison = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, columnFilters, visibleOrderedColumns, sortColumnId, sortDirection]);

  const exportAsCsv = () => {
    if (visibleOrderedColumns.length === 0) {
      return;
    }

    const headers = visibleOrderedColumns.map((column) => column.fullLabel || column.label);
    const csvRows = processedRows.map((row) =>
      visibleOrderedColumns
        .map((column) => escapeCsvValue(String(column.getDisplayValue(row) ?? "")))
        .join(","),
    );

    const csvContent = [
      headers.map((header) => escapeCsvValue(header)).join(","),
      ...csvRows,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleColumnVisibility = (columnId: string, nextChecked: boolean) => {
    if (pinnedColumnIds.includes(columnId) && !nextChecked) {
      return;
    }

    setVisibleColumnIds((previous) => {
      if (nextChecked) {
        if (previous.includes(columnId)) {
          return previous;
        }
        return ensurePinnedColumnsFirst([...previous, columnId]);
      }

      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((id) => id !== columnId);
    });
  };

  const moveColumnInOrder = (columnId: string, direction: "up" | "down") => {
    if (pinnedColumnIds.includes(columnId)) {
      return;
    }

    setColumnOrder((previous) => {
      const index = previous.indexOf(columnId);
      if (index === -1) {
        return previous;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return ensurePinnedColumnsFirst(next);
    });
  };

  const handleSort = (columnId: string) => {
    if (sortColumnId === columnId) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumnId(columnId);
    setSortDirection("asc");
  };

  const reorderColumns = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    if (pinnedColumnIds.includes(fromId) || pinnedColumnIds.includes(toId)) {
      return;
    }

    setColumnOrder((previous) => {
      const from = previous.indexOf(fromId);
      const to = previous.indexOf(toId);
      if (from === -1 || to === -1) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return ensurePinnedColumnsFirst(next);
    });
  };

  // ── Pointer-based column dragging (transform-only, FLIP) ─────────────────
  // Handles are only anchors. Nothing reorders in the DOM while dragging:
  // the dragged column is glued to the pointer and the columns it passes
  // slide aside via animated transforms. On release the final order is
  // committed and every transform is released — the snap is seamless because
  // the transforms already match the committed layout.
  const cellKey = (row: T, columnId: string) => `${rowKey(row)}::${columnId}`;

  const applyCellTransform = (
    cell: HTMLTableCellElement | null | undefined,
    shiftPx: number,
    glued: boolean,
  ) => {
    if (!cell) {
      return;
    }
    cell.style.transform = shiftPx !== 0 || glued ? `translateX(${shiftPx}px)` : "";
    cell.style.transition = glued ? "none" : "transform 150ms ease-out";
  };

  const applyColumnTransform = (
    columnId: string,
    shiftPx: number,
    glued: boolean,
  ) => {
    applyCellTransform(headerCellRefs.current[columnId], shiftPx, glued);
    for (const [key, cell] of bodyCellRefs.current) {
      if (key.endsWith(`::${columnId}`)) {
        applyCellTransform(cell, shiftPx, glued);
      }
    }
  };

  const clearAllTransforms = () => {
    for (const columnId of Object.keys(headerCellRefs.current)) {
      applyCellTransform(headerCellRefs.current[columnId], 0, false);
    }
    for (const [, cell] of bodyCellRefs.current) {
      applyCellTransform(cell, 0, false);
    }
  };

  const computePassCounts = (pointerCenter: number) => {
    const ctx = dragCtxRef.current;
    if (!ctx) {
      return { passedLeft: 0, passedRight: 0 };
    }

    let passedLeft = 0;
    let passedRight = 0;
    for (let i = 0; i < ctx.originalMovableOrder.length; i++) {
      const id = ctx.originalMovableOrder[i];
      if (id === draggedColumnId) {
        continue;
      }
      const center = ctx.centers[id];
      if (typeof center !== "number") {
        continue;
      }
      if (i > ctx.originalIndex && pointerCenter > center) {
        passedRight += 1;
      }
      if (i < ctx.originalIndex && pointerCenter < center) {
        passedLeft += 1;
      }
    }
    return { passedLeft, passedRight };
  };

  const startColumnDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    columnId: string,
  ) => {
    if (pinnedColumnIds.includes(columnId)) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const contentRect = contentRef.current?.getBoundingClientRect();
    const draggedCell = headerCellRefs.current[columnId];
    if (!contentRect || !draggedCell) {
      return;
    }

    // Freeze all measurements at drag start — nothing is re-measured mid-gesture.
    const centers: Record<string, number> = {};
    for (const column of visibleOrderedColumns) {
      const node = headerCellRefs.current[column.id];
      if (node) {
        const rect = node.getBoundingClientRect();
        centers[column.id] = rect.left - contentRect.left + rect.width / 2;
      }
    }

    const cellRect = draggedCell.getBoundingClientRect();
    const movable = visibleOrderedColumns.filter(
      (column) => !pinnedColumnIds.includes(column.id),
    );

    dragCtxRef.current = {
      originCenter: cellRect.left - contentRect.left + cellRect.width / 2,
      draggedWidth: cellRect.width,
      originalMovableOrder: movable.map((column) => column.id),
      originalIndex: movable.findIndex((column) => column.id === columnId),
      contentLeft: contentRect.left,
      centers,
    };
    setDraggedColumnId(columnId);
  };

  const moveColumnDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ctx = dragCtxRef.current;
    if (!ctx || !draggedColumnId) {
      return;
    }
    event.preventDefault();

    const offset = event.clientX - ctx.contentLeft - ctx.originCenter;
    const pointerCenter = ctx.originCenter + offset;

    // Dragged column: glued to the pointer (no transition).
    applyColumnTransform(draggedColumnId, offset, true);

    // Neighbors: slide to their exact FINAL slot positions, animated.
    // A passed column lands in the adjacent slot, so its displacement is the
    // distance between the two frozen centers — not the dragged width.
    for (let i = 0; i < ctx.originalMovableOrder.length; i++) {
      const id = ctx.originalMovableOrder[i];
      if (id === draggedColumnId) {
        continue;
      }
      const center = ctx.centers[id];
      if (typeof center !== "number") {
        continue;
      }
      let shift = 0;
      if (i > ctx.originalIndex && pointerCenter > center) {
        shift = (ctx.centers[ctx.originalMovableOrder[i - 1]] ?? center) - center;
      }
      if (i < ctx.originalIndex && pointerCenter < center) {
        shift = (ctx.centers[ctx.originalMovableOrder[i + 1]] ?? center) - center;
      }
      applyColumnTransform(id, shift, false);
    }
  };

  const endColumnDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ctx = dragCtxRef.current;
    if (!ctx || !draggedColumnId) {
      return;
    }
    event.preventDefault();

    const offset = event.clientX - ctx.contentLeft - ctx.originCenter;
    const pointerCenter = ctx.originCenter + offset;
    const { passedLeft, passedRight } = computePassCounts(pointerCenter);
    const finalIndex = ctx.originalIndex - passedLeft + passedRight;

    // Commit synchronously so the DOM is updated before the browser paints.
    flushSync(() => {
      setColumnOrder((previous) => {
        const from = previous.indexOf(draggedColumnId);
        const target = pinnedColumnIds.length + finalIndex;
        if (from === -1 || from === target) {
          return previous;
        }
        const next = [...previous];
        const [moved] = next.splice(from, 1);
        next.splice(target, 0, moved);
        return ensurePinnedColumnsFirst(next);
      });
    });

    dragCtxRef.current = null;
    setDraggedColumnId(null);

    // Clear all drag transforms INSTANTLY — no release animation. The
    // neighbors are already sitting in their final slots, and the dragged
    // column simply drops into its slot from the cursor position.
    for (const columnId of Object.keys(headerCellRefs.current)) {
      const cell = headerCellRefs.current[columnId];
      if (cell) {
        cell.style.transform = "";
        cell.style.transition = "none";
      }
    }
    for (const [, cell] of bodyCellRefs.current) {
      cell.style.transform = "";
      cell.style.transition = "none";
    }
  };

  const cancelColumnDrag = () => {
    dragCtxRef.current = null;
    setDraggedColumnId(null);
    clearAllTransforms();
  };

  // Lost pointer capture fires right after pointerup (successful release) too —
  // in that case endColumnDrag already nulled the context, so this only cancels
  // genuinely aborted drags (e.g. touch scroll taking over).
  const handleLostPointerCapture = () => {
    if (dragCtxRef.current) {
      cancelColumnDrag();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">{toolbarLeft}</div>
        <div className="flex items-center gap-2">
          {toolbarRight}
          <Button type="button" variant="outline" size="sm" onClick={exportAsCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orderedColumns
                .filter((column) => !pinnedColumnIds.includes(column.id))
                .map((column, index, dropdownColumns) => {
                  const isPinnedColumn = pinnedColumnIds.includes(column.id);
                  const isVisible = isPinnedColumn ? true : visibleColumnIds.includes(column.id);
                  const disableToggle = isPinnedColumn || (isVisible && visibleColumnIds.length === 1);
                  const menuLabel = column.fullLabel
                    ? `${column.label} - ${truncateLabel(column.fullLabel, 42)}`
                    : column.label;

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isVisible}
                      disabled={disableToggle}
                      draggable={!isPinnedColumn}
                      onDragStart={() => {
                        if (!isPinnedColumn) {
                          setMenuDraggedColumnId(column.id);
                        }
                      }}
                      onDragEnd={() => {
                        if (!isPinnedColumn) {
                          setMenuDraggedColumnId(null);
                        }
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!isPinnedColumn && menuDraggedColumnId) {
                          reorderColumns(menuDraggedColumnId, column.id);
                        }
                      }}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        toggleColumnVisibility(column.id, checked === true)
                      }
                      title={column.fullLabel || column.label}
                      className="flex items-center gap-2"
                    >
                      {!isPinnedColumn ? (
                        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <span className="w-3.5" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{menuLabel}</span>
                      <span className="ml-auto flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={isPinnedColumn || index === 0}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!isPinnedColumn) {
                              moveColumnInOrder(column.id, "up");
                            }
                          }}
                          title="Move column up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={isPinnedColumn || index === dropdownColumns.length - 1}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!isPinnedColumn) {
                              moveColumnInOrder(column.id, "down");
                            }
                          }}
                          title="Move column down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                      {disableToggle ? (
                        <span className="sr-only">At least one column must remain visible</span>
                      ) : null}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-md border">
          <div className="overflow-x-auto">
            <div ref={contentRef} className="relative min-w-full">
              <Table className={draggedColumnId ? "select-none" : undefined}>
                <TableHeader className="bg-muted/60">
                  <TableRow className="border-b border-border/80">
                    {visibleOrderedColumns.map((column) => {
                      const isSorted = sortColumnId === column.id;
                      const dynamicColumn = column.id.startsWith("field:");

                      return (
                        <TableHead
                          key={column.id}
                          className={`relative px-3 pt-2 pb-2 align-top ${
                            column.headerClassName ??
                            (column.renderCell && !column.label ? "w-[52px] min-w-[52px] max-w-[52px]" : "min-w-[180px]")
                          } ${dynamicColumn ? "bg-slate-200/80 dark:bg-slate-800/55" : "bg-muted/60"}`}
                          ref={(node) => {
                            headerCellRefs.current[column.id] = node;
                          }}
                        >
                          {!pinnedColumnIds.includes(column.id) ? (
                            <div className="flex justify-center pb-1">
                              <button
                                type="button"
                                onPointerDown={(event) => startColumnDrag(event, column.id)}
                                onPointerMove={moveColumnDrag}
                                onPointerUp={endColumnDrag}
                                onPointerCancel={cancelColumnDrag}
                                onLostPointerCapture={handleLostPointerCapture}
                                className="cursor-grab touch-none select-none rounded px-1 py-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 active:cursor-grabbing"
                                title="Drag to reorder column"
                                aria-label={`Drag handle for ${column.fullLabel || column.label}`}
                              >
                                <GripHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          ) : null}
                          {!column.renderCell || column.label ? (
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleSort(column.id)}
                                className="inline-flex items-center gap-1 font-semibold hover:underline"
                                title={column.fullLabel || column.label}
                              >
                                {column.label}
                                <ArrowUpDown
                                  className={`h-3.5 w-3.5 ${isSorted ? "text-foreground" : "text-muted-foreground"}`}
                                />
                                {isSorted ? (
                                  <span className="text-[10px] uppercase">{sortDirection}</span>
                                ) : null}
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant={columnFilters[column.id] ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 px-2"
                                  >
                                    <Filter className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                  <DropdownMenuLabel className="px-0 py-0 text-xs font-semibold">
                                    Filter {column.fullLabel || column.label}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Input
                                    value={columnFilters[column.id] || ""}
                                    onChange={(event) =>
                                      setColumnFilters((previous) => ({
                                        ...previous,
                                        [column.id]: event.target.value,
                                      }))
                                    }
                                    placeholder={column.placeholder || "Filter"}
                                    className="h-8 text-xs"
                                  />
                                  <div className="mt-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setColumnFilters((previous) => ({
                                          ...previous,
                                          [column.id]: "",
                                        }))
                                      }
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : null}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRows.map((row) => (
                    <TableRow key={rowKey(row)} className={getRowTint ? getRowTint(row) : undefined}>
                      {visibleOrderedColumns.map((column) => {
                        return (
                          <TableCell
                            key={column.id}
                            className={`align-top whitespace-pre-wrap ${column.cellClassName ?? ""}`}
                            ref={(node) => {
                              if (node) {
                                bodyCellRefs.current.set(cellKey(row, column.id), node);
                              }
                            }}
                          >
                            {column.renderCell
                              ? column.renderCell(row)
                              : column.getDisplayValue(row)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {processedRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </div>
  );
};
