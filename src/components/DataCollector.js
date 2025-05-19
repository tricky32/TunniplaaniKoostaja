// DataCollector.js
// See fail vastutab andmete kogumise ja puhastamise eest.
// Parandused: igale sündmusele seotakse välja `weeks` (võrdub `weekCodes` väärtusega),
// ning optimeerimise nupp käivitab optimeerimisalgoritmi ja määrab kohe optimeeritud lahenduse kuvatavaks.

import React, { useState } from "react";
import { getDepartments }   from "../taltech_api/get_departments";
import { getProgram }       from "../taltech_api/get_program";
import { optimizeSchedule } from "./scheduleOptimizer";
import TimetableDisplay     from "./TimetableDisplay";
//import LoadingAnimation from "./LoadingAnimation";

/** Abifunktsioon: teisendab row.sgs (string või massiiv) Set-iks, et saada rühmade nimed. */
function transformSGS(sgs) {
  const set = new Set();
  if (!sgs) return set;
  if (typeof sgs === "string") {
    sgs.split(",").forEach((part) => set.add(part.trim()));
  } else if (Array.isArray(sgs)) {
    sgs.forEach((item) => {
      if (typeof item === "string") {
        set.add(item.trim());
      } else if (item.code) {
        set.add(item.code.trim());
      }
    });
  } else if (sgs.code) {
    set.add(sgs.code.trim());
  }
  return set;
}

/** Leiame kõik rühmad (unikaalsed) kogu rawData seest. */
function getAllGroups(rows) {
  const allSets = rows.map((r) => transformSGS(r.sgs));
  const groupSet = new Set();
  allSets.forEach((sgSet) => {
    sgSet.forEach((g) => groupSet.add(g));
  });
  return Array.from(groupSet).sort();
}

/** Ühendame duplikaatread: kui sama tunniga (sama dow, startTime, endTime, subjectCode)
 * on mitu kirjet, ühendame need ühte ning liidame weekCodes, teachers ja rooms.
 */
function combineSimilarRows(rows) {
  const map = {};
  rows.forEach((row) => {
    const dow = row.dow ?? -1;
    const start = row.startTime || "";
    const end = row.endTime || "";
    const subject = row.subjectCode || "";
    const key = `${dow}||${subject}||${start}||${end}`;
    if (!map[key]) {
      map[key] = {
        ...row,
        weekCodes: row.weekCodes ? [...row.weekCodes] : [],
        teachers: row.teachers ? [...row.teachers] : [],
        rooms: row.rooms ? [...row.rooms] : [],
      };
    } else {
      const existing = map[key];
      if (row.weekCodes) {
        existing.weekCodes.push(...row.weekCodes);
      }
      if (row.teachers) {
        existing.teachers.push(...row.teachers);
      }
      if (row.rooms) {
        existing.rooms.push(...row.rooms);
      }
    }
  });
  return Object.values(map).map((item) => ({
    ...item,
    weekCodes: Array.from(new Set(item.weekCodes)),
    teachers: Array.from(new Set(item.teachers.map((t) => t.teacherName)))
      .map((name) => ({ teacherName: name })),
    rooms: Array.from(new Set(item.rooms.map((r) => r.roomNo)))
      .map((roomNo) => ({ roomNo })),
  }));
}

/** Abifunktsioon nädalakoodide teisendamiseks, nt "NADAL_8" -> 8 */
function parseWeekCode(weekCode) {
  if (typeof weekCode === "string" && weekCode.startsWith("NADAL_")) {
    const num = parseInt(weekCode.replace("NADAL_", ""), 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

export default function DataCollector({ departmentId = 50001, timetableId = 6 }) {
  const [rawData, setRawData] = useState([]);
  const [optimizedData, setOptimizedData] = useState([]);
  const [showOptimized, setShowOptimized] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedWeek, setSelectedWeek] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLoadAll() {
    try {
      setLoading(true);
      setError(null);
      const depData = await getDepartments(timetableId);
      const departments = Array.isArray(depData) ? depData : depData.departments;
      const itDept = departments.find((d) => d.departmentId === departmentId);
      if (!itDept) throw new Error(`Ei leidnud deptId=${departmentId}`);
      if (!itDept.curriculums) throw new Error("Teaduskonnal puudub .curriculums");

      let combined = [];
      for (const cur of itDept.curriculums) {
        if (!cur.studentGroups) continue;
        for (const sg of cur.studentGroups) {
          const progData = await getProgram(
            sg.id,
            sg.curriculumVersionId,
            departmentId,
            timetableId
          );
          if (progData.weekDays) {
            combined.push(...progData.weekDays.flatMap((day) => day.rows));
          }
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      combined = combineSimilarRows(combined);
      // Seome igale sündmusele välja `weeks`, mis on võrdne `weekCodes` väärtusega
      combined = combined.map(event => ({ ...event, weeks: event.weekCodes }));
      setRawData(combined);
      const groups = getAllGroups(combined);
      setAllGroups(groups);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function handleOptimize() {
    const optimized = optimizeSchedule(rawData);
    // Veendu, et optimeeritud lahendus seob samuti välja `weeks`
    const optimizedWithWeeks = optimized.map(event => ({ ...event, weeks: event.weekCodes }));
    setOptimizedData(optimizedWithWeeks);
    // Määrame kohe optimeeritud režiimi, et näha tulemusi
    setShowOptimized(true);
  }

  const currentPlan = showOptimized && optimizedData.length ? optimizedData : rawData;
  const groupFilteredPlan =
    selectedGroup === "ALL"
      ? currentPlan
      : currentPlan.filter((row) => {
          const sgsSet = transformSGS(row.sgs);
          return sgsSet.has(selectedGroup);
        });

  // Filtreerime vastavalt valitud nädala põhjal, kasutades parseWeekCode funktsiooni
  const displayedPlan =
    selectedWeek === "ALL"
      ? groupFilteredPlan
      : groupFilteredPlan.filter((row) =>
          row.weekCodes && row.weekCodes.some(wc => parseWeekCode(wc) === Number(selectedWeek))
        );

        return (
          <div>
            <button className="btn" onClick={handleLoadAll} disabled={loading}>
              {loading ? "Laen..." : "Lae andmed"}
            </button>
            <button className="btn" onClick={handleOptimize} disabled={!rawData.length}>
              Optimeeri tunniplaan
            </button>
            <div className="mt-1">
              <button className="btn" onClick={() => setShowOptimized(false)}>
                Näita algset tunniplaani
              </button>
              <button className="btn" onClick={() => setShowOptimized(true)}>
                Näita optimeeritud tunniplaani
              </button>
            </div>
            {allGroups.length > 0 && (
              <div className="mt-1">
                <label>
                  Vali rühm:{" "}
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <option value="ALL">Kuva kõik</option>
                    {allGroups.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="mt-1">
              <label>
                Vali nädal:{" "}
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                >
                  <option value="ALL">Kuva kõik</option>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>
                      Nädal {week}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <TimetableDisplay rows={displayedPlan} />
          </div>
        );
        
}
