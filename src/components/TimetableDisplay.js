import React, { useState } from "react";
import { TimetableGrid } from "./TimeBlock"; // eeldades, et impordid nimepidi kui muutsime seal

const dayNames = {
  ALL: "Kuva kõik päevad",
  "-1": "Veebipõhine / Muu",
  1: "Esmaspäev",
  2: "Teisipäev",
  3: "Kolmapäev",
  4: "Neljapäev",
  5: "Reede",
  6: "Laupäev",
  7: "Pühapäev",
};

const dayKeys = ["ALL", "1", "2", "3", "4", "5", "6", "7", "-1"];

export default function TimetableDisplay({ rows }) {
  const [selectedDay, setSelectedDay] = useState("ALL");

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const filteredRows =
    selectedDay === "ALL"
      ? rows
      : rows.filter((r) => String(r.dow) === selectedDay);

  return (
    <div>
      {/* Päevade nupud */}
      <div className="day-button-group">
        {dayKeys.map((dayKey) => (
          <button
            key={dayKey}
            className={`day-button${
              selectedDay === dayKey ? " active" : ""
            }`}
            onClick={() => handleDayClick(dayKey)}
          >
            {dayNames[dayKey]}
          </button>
        ))}
      </div>

      {/* Graafiline tunniplaan */}
      <div className="timetable-container">
        <TimetableGrid events={filteredRows} pixelsPerMinute={1} />
      </div>
    </div>
  );
}
