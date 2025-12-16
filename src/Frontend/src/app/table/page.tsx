"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

type Element = {
  id: number;
  Code: string;
  OwnerName: string;
};

type Entry = {
  id: number;
  date: string; // ISO string
  hours: number;
  description: string;
  element: Element;
};

type RowData = {
  element: Element;
  hoursByDay: Record<number, number>;
  hoursByWeek: Record<string, number>; // key: `${isoYear}-KW${week}`
  monthTotal: number;
};

function toIsoDateOnly(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMockElements(count: number): Element[] {
  const ownerNames = [
    "Alice",
    "Bob",
    "Carla",
    "Dieter",
    "Emil",
    "Fatima",
    "Gustav",
    "Hanna",
    "Ivan",
    "Jana",
  ];

  return Array.from({length: count}, (_, idx) => {
    const id = idx + 1;
    const code = `E-${String(100 + id).padStart(3, "0")}`;
    const owner = ownerNames[idx % ownerNames.length];

    return {
      id,
      Code: code,
      OwnerName: owner,
    };
  });
}

function buildMockEntriesFromElements(params: {
  year: number;
  monthIndex0: number;
  daysInMonth: number;
  elements: Element[];
  entriesPerElement: number; // z.B. 6
  seed?: number;
}): Entry[] {
  const {
    year,
    monthIndex0,
    daysInMonth,
    elements,
    entriesPerElement,
    seed = 12345,
  } = params;

  const rand = mulberry32(seed);
  const descriptions = [
    "Analyse",
    "Implementierung",
    "Review",
    "Meeting",
    "Bugfix",
    "Doku",
    "Support",
    "Konzept",
  ];

  let entryId = 1;
  const entries: Entry[] = [];

  for (const el of elements) {
    for (let i = 0; i < entriesPerElement; i++) {
      const day = 1 + Math.floor(rand() * daysInMonth); // 1..daysInMonth
      const hoursRaw = rand() * 8; // 0..8
      const hours = Math.round(hoursRaw * 2) / 4; // halbe Stunden
      const description = descriptions[Math.floor(rand() * descriptions.length)];

      entries.push({
        id: entryId++,
        element: el,
        date: toIsoDateOnly(new Date(year, monthIndex0, day)),
        hours,
        description,
      });
    }
  }

  return entries;
}

function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getIsoWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

function groupEntriesToRows(entries: Entry[]): RowData[] {
  const map = new Map<number, RowData>();

  for (const e of entries) {
    const date = new Date(e.date);
    const day = date.getDate();
    const isoWeek = getIsoWeek(date);
    const isoYear = getIsoWeekYear(date);
    const weekKey = `${isoYear}-KW${String(isoWeek).padStart(2, "0")}`;

    const existing =
            map.get(e.element.id) ??
            ({
              element: e.element,
              hoursByDay: {},
              hoursByWeek: {},
              monthTotal: 0,
            } satisfies RowData);

    existing.hoursByDay[day] = (existing.hoursByDay[day] ?? 0) + e.hours;
    existing.hoursByWeek[weekKey] = (existing.hoursByWeek[weekKey] ?? 0) + e.hours;
    existing.monthTotal += e.hours;

    map.set(e.element.id, existing);
  }

  return Array.from(map.values());
}

const TablePage = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const monthIndex0 = currentDate.getMonth();
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();

  const [entries] = useState<Entry[]>(() => {
    const elements = buildMockElements(50);
    return buildMockEntriesFromElements({
      year,
      monthIndex0,
      daysInMonth,
      elements,
      entriesPerElement: 30,
      seed: year * 100 + (monthIndex0 + 1),
    });
  });

  const data = useMemo<RowData[]>(() => groupEntriesToRows(entries), [entries]);

  // Beim Öffnen: aktueller Tag selektiert (für diesen Monat)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date();
    const isSameMonth = today.getFullYear() === year && today.getMonth() === monthIndex0;
    if (!isSameMonth) return 1;
    const d = today.getDate();
    return Math.min(Math.max(d, 1), daysInMonth);
  });

  const selectedDate = useMemo(
          () => new Date(year, monthIndex0, selectedDay),
          [year, monthIndex0, selectedDay]
  );

  const selectedIsoWeek = useMemo(() => getIsoWeek(selectedDate), [selectedDate]);
  const selectedIsoWeekYear = useMemo(() => getIsoWeekYear(selectedDate), [selectedDate]);

  const totals = useMemo(() => {
    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    for (const e of entries) {
      const d = new Date(e.date);

      const sameMonth = d.getFullYear() === year && d.getMonth() === monthIndex0;
      if (sameMonth) {
        monthTotal += e.hours;

        if (d.getDate() === selectedDay) {
          dayTotal += e.hours;
        }

        const wk = getIsoWeek(d);
        const wy = getIsoWeekYear(d);
        if (wk === selectedIsoWeek && wy === selectedIsoWeekYear) {
          weekTotal += e.hours;
        }
      }
    }

    return {dayTotal, weekTotal, monthTotal};
  }, [entries, year, monthIndex0, selectedDay, selectedIsoWeek, selectedIsoWeekYear]);

  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    const dayCols: ColumnDef<RowData>[] = Array.from({length: daysInMonth}, (_, idx) => {
      const day = idx + 1;
      return {
        id: `day-${day}`,
        header: () => (
                <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className="w-full text-left"
                        title={`Tag ${day} auswählen`}
                >
                  {day}
                </button>
        ),
        accessorFn: (row) => row.hoursByDay[day] ?? 0,
        cell: (info) => {
          const v = info.getValue<number>();
          return v ? v : "";
        },
      };
    });

    return [
      {
        id: "element",
        header: "Element",
        accessorFn: (row) => `${row.element.Code} (${row.element.OwnerName})`,
        cell: (info) => info.getValue<string>(),
      },
      ...dayCols,
    ];
  }, [daysInMonth]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const didInitialScrollRef = useRef(false);
  const dayHeaderRefs = useRef<Record<number, HTMLTableCellElement | null>>({});

  const scrollSelectedDayIntoCenter = (behavior: ScrollBehavior) => {
    const el = dayHeaderRefs.current[selectedDay];
    if (!el) return;

    el.scrollIntoView({
      behavior,
      block: "nearest",
      inline: "center",
    });
  };

  // 1) Initial: sofort zentrieren (ohne Animation), bevor der Browser paintet → kein "Springen"
  useLayoutEffect(() => {
    if (didInitialScrollRef.current) return;

    requestAnimationFrame(() => {
      scrollSelectedDayIntoCenter("auto");
      didInitialScrollRef.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Danach: bei jeder Änderung smooth nachziehen (Header-Button oder Input-Focus)
  useEffect(() => {
    if (!didInitialScrollRef.current) return;
    scrollSelectedDayIntoCenter("smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  return (
          <section className="m-1 gap-2">
            <div className="text-sm border rounded p-2 bg-gray-700">
              <span className="font-semibold">Ausgewählt:</span>{" "}
              {selectedDate.toLocaleDateString("de-DE")}
              {" — "}
              <span className="font-semibold">KW:</span> {selectedIsoWeek}
              {" — "}
              <span className="font-semibold">Tag:</span> {totals.dayTotal}h
              {" / "}
              <span className="font-semibold">KW:</span> {totals.weekTotal}h
              {" / "}
              <span className="font-semibold">Monat:</span> {totals.monthTotal}h
            </div>

            <table>
              <thead>
              {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => {
                          const isElementCol = header.column.id === "element";
                          const isSelectedDayCol = header.column.id === `day-${selectedDay}`;

                          const dayMatch = /^day-(\d+)$/.exec(header.column.id);
                          const dayFromColumn = dayMatch ? Number(dayMatch[1]) : null;

                          return (
                                  <th
                                          key={header.id}
                                          ref={(node) => {
                                            if (dayFromColumn != null) dayHeaderRefs.current[dayFromColumn] = node;
                                          }}
                                          className={[
                                            "pl-1 pr-2 text-left whitespace-nowrap",
                                            " bg-gray-800",
                                            isSelectedDayCol ? "bg-red-900" : "",
                                            isElementCol ? "bg-gray-900" : "",
                                          ].join(" ")}
                                  >
                                    {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                  </th>
                          );
                        })}
                      </tr>
              ))}
              </thead>

              <tbody>
              {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => {
                          const isElementCol = cell.column.id === "element";
                          const isSelectedDayCol = cell.column.id === `day-${selectedDay}`;

                          const dayMatch = /^day-(\d+)$/.exec(cell.column.id);
                          const dayFromColumn = dayMatch ? Number(dayMatch[1]) : null;

                          return (
                                  <td
                                          key={cell.id}
                                          className={[
                                            "pl-1 pr-2 whitespace-nowrap",
                                            isSelectedDayCol ? "bg-red-950" : "",
                                            isElementCol ? "bg-gray-800" : "",
                                          ].join(" ")}
                                  >
                                    {isElementCol ? (
                                            flexRender(cell.column.columnDef.cell, cell.getContext())
                                    ) : (
                                            <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0"
                                                    defaultValue={cell.getValue<number>() ?? ""}
                                                    onFocus={(e) => {
                                                      if (dayFromColumn != null) setSelectedDay(dayFromColumn);
                                                      e.currentTarget.select();
                                                    }}
                                                    className="w-14 text-sm px-1 py-0.5 rounded"
                                            />
                                    )}
                                  </td>
                          );
                        })}
                      </tr>
              ))}
              </tbody>
            </table>
          </section>
  );
};

export default TablePage;