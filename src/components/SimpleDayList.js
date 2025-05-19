import React from "react";

/** Grupeerime tunnid päevade kaupa ja sorteerime startTime järgi. */
function groupByDow(rows) {
  const map = {};
  rows.forEach((row) => {
    const d = row.dow ?? -1;
    if (!map[d]) map[d] = [];
    map[d].push(row);
  });
  // Sorteerime iga päeva tunnid algusaegade järgi.
  for (const d in map) {
    map[d].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }
  return map;
}

const dayNames = {
  "-1": "Veebipõhine / Muu",
  "1": "Esmaspäev",
  "2": "Teisipäev",
  "3": "Kolmapäev",
  "4": "Neljapäev",
  "5": "Reede",
  "6": "Laupäev",
  "7": "Pühapäev",
};

function getSessionType(typeCode) {
  if (!typeCode) return "";
  const code = typeCode.toUpperCase();
  if (code.includes("LP")) return "Loeng + Praktikum";
  if (code.includes("L")) return "Loeng";
  if (code.includes("P")) return "Praktikum/Harjutus";
  return typeCode;
}

export default function SimpleDayList({ rows }) {
  const dayMap = groupByDow(rows);
  return (
    <div style={{ marginTop: "1rem" }}>
      {Object.entries(dayMap).map(([dow, dayRows]) => (
        <div key={dow} style={{ marginBottom: "1rem" }}>
          <h3>{dayNames[dow] || `Päev ${dow}`}</h3>
          <ul>
            {dayRows.map((row, i) => (
              <li key={i}>
                <strong>{row.subjectCode}</strong> – {row.subjectName}
                {row.subjectNameEn ? ` (${row.subjectNameEn})` : ""}
                <br />
                Aeg: {row.startTime} - {row.endTime}
                <br />
                Ruum:{" "}
                {row.rooms && row.rooms.length > 0
                  ? row.rooms.map((r) => r.roomNo).join(", ")
                  : "?"}
                <br />
                Õppejõud:{" "}
                {row.teachers && row.teachers.length > 0
                  ? row.teachers.map((t) => t.teacherName).join(", ")
                  : ""}
                {row.type && (
                  <>
                    <br />
                    Tunni tüüp: {getSessionType(row.type)}
                  </>
                )}
                {row.weeks && (
                  <>
                    <br />
                    Nädalad: {row.weeks}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
