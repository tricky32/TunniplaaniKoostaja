// TimeBlock.js
// See fail tegeleb tunniklotside kuvamisega ning sisaldab kõiki vajalikke funktsioone,
// sealhulgas assignColumns ja formatWeeks, et kuvada tunniplaan nii nagu soovid.
// Funktsioonid on defineeritud arrow‑funktsioonidena, et vältida "not defined" ESLinti vigu.

import React from "react";
// Kui index.css pole veel globaalselt imporditud, lisa:
// import "../index.css";

/* ------------------------------------------------------------------ *
 *  Apu‑funktsioonid
 * ------------------------------------------------------------------ */

// teisendab "HH:MM" (või "HH:MM:SS") minutiteks alates 00:00
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.slice(0, 5).split(":").map(Number); // ⬅️ kasutame ainult HH:MM
  return hh * 60 + (mm || 0);
};

const doesOverlap = (e1, e2) =>
  !(timeToMinutes(e1.endTime)   <= timeToMinutes(e2.startTime) ||
    timeToMinutes(e2.endTime)   <= timeToMinutes(e1.startTime));

const assignColumns = (events) => {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const columns = [];
  sorted.forEach((event) => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      if (!columns[i].some((e) => doesOverlap(e, event))) {
        columns[i].push(event);
        event.columnIndex = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
      event.columnIndex = columns.length - 1;
    }
  });
  const totalCols = columns.length;
  events.forEach((ev) => (ev.totalColumns = totalCols));
  return events;
};

const formatWeeks = (weeks) => {
  if (!Array.isArray(weeks)) weeks = [weeks];
  const nums = weeks
    .map((w) =>
      typeof w === "string" && w.startsWith("NADAL_")
        ? parseInt(w.replace("NADAL_", ""), 10)
        : w
    )
    .filter((n) => n != null)
    .sort((a, b) => a - b);

  if (!nums.length) return "";
  const sequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return sequential ? `${nums[0]}–${nums.at(-1)}` : nums.join(", ");
};

/* ------------------------------------------------------------------ *
 *  TimeBlock komponent
 * ------------------------------------------------------------------ */
export default function TimeBlock({
  startTime,
  endTime,
  subjectCode,
  subjectName,
  teachers = [],
  rooms = [],
  weeks,
  type,
  pixelsPerMinute = 2,
  columnIndex = 0
}) {
  const formattedStart = startTime ? startTime.slice(0, 5) : "";
  const formattedEnd   = endTime   ? endTime.slice(0, 5)   : "";

  const startMin = timeToMinutes(formattedStart);
  const endMin   = timeToMinutes(formattedEnd);
  const duration = endMin - startMin;
  if (duration <= 0) return null; // kaitse vigaste andmete vastu

  const top    = (startMin - 8 * 60) * pixelsPerMinute;
  const height = duration * pixelsPerMinute;
  const left   = 100 + columnIndex * 210;

  let accent = "#6c757d";
  const t = (type || "").toLowerCase();
  if (t.includes("lh") || t.includes("loeng")) accent = "#007bff";
  else if (t.includes("p")) accent = "#28a745";

  return (
    <div
      className="timeBlock"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        "--tb-accent": accent
      }}
    >
      <div className="tb-header">
        {formattedStart}–{formattedEnd}
      </div>
      <div className="tb-title">
        <strong>{subjectCode}</strong> – {subjectName}
      </div>
      <div className="tb-meta">
        {teachers.length > 0 && (
          <span>Õppejõud: {teachers.map((t) => t.teacherName).join(", ")}</span>
        )}
        {rooms.length > 0 && (
          <span>Ruum: {rooms.map((r) => r.roomNo).join(", ")}</span>
        )}
        {weeks && <span>Nädalad: {formatWeeks(weeks)}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  BackgroundLines – jooned iga 30 min (08:00–23:00)
 * ------------------------------------------------------------------ */
function BackgroundLines({
  start = "08:00",
  end   = "23:00",
  interval = 30,
  pixelsPerMinute = 2,
  containerWidth  = 800
}) {
  const sMin = timeToMinutes(start);
  const eMin = timeToMinutes(end);

  const lines = [];
  for (let m = sMin; m <= eMin; m += interval) lines.push(m);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: containerWidth, zIndex: 0 }}>
      {lines.map((m) => {
        const offset = (m - sMin) * pixelsPerMinute;
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        return (
          <div
            key={m}
            style={{
              position: "absolute",
              top: `${offset}px`,
              left: 0,
              right: 0,
              borderTop: "1px solid #ccc",
              boxSizing: "border-box"
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 5,
                top: "-0.8em",
                fontSize: "0.8rem",
                backgroundColor: "#fff",
                padding: "0 2px"
              }}
            >
              {hh}:{mm}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  TimetableGrid – terve päeva graafik
 * ------------------------------------------------------------------ */
export function TimetableGrid({ events, pixelsPerMinute = 2 }) {
  const validEvents = events.filter((e) => e.startTime && e.endTime);
  const eLearningEvents = events.filter((e) => !e.startTime || !e.endTime);

  assignColumns(validEvents);

  const totalMinutes    = (23 - 8) * 60;            // 08–23
  const containerHeight = totalMinutes * pixelsPerMinute;
  const maxCols = validEvents.reduce(
    (acc, ev) => Math.max(acc, ev.columnIndex || 0),
    0
  ) + 1;
  const containerWidth = 100 + maxCols * 210;

  const gridStyle = {
    position: "relative",
    height: `${containerHeight}px`,
    width:  `${containerWidth}px`,
    border: "1px solid #ddd"
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ⬇️  Horisontaalne kerimine ainult graafiku kastile */}
      <div className="grid-scroll">
        <div style={gridStyle}>
          <BackgroundLines
            start="08:00"
            end="23:00"
            interval={30}
            pixelsPerMinute={pixelsPerMinute}
            containerWidth={containerWidth}
          />
          {validEvents.map((ev, i) => (
            <TimeBlock
              key={i}
              {...ev}
              pixelsPerMinute={pixelsPerMinute}
              columnIndex={ev.columnIndex}
            />
          ))}
        </div>
      </div>

      {/* Veebipõhine õpe jääb kerimisriba alla */}
      {eLearningEvents.length > 0 && (
        <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "10px" }}>
          <h3>Veebipõhine õpe</h3>
          {eLearningEvents.map((ev, i) => (
            <div
              key={i}
              style={{
                padding: "5px",
                margin: "5px 0",
                backgroundColor: "#f9f9f9",
                border: "1px solid #bbb"
              }}
            >
              <strong>{ev.subjectCode}</strong> – {ev.subjectName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
