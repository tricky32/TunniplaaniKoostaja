// get_courses.js

// NB! Kui tahad ka getTimetablesInRange kasutada, pead impordina lisama:
 import { getTimetables } from "./get_timetables"; // <-- kohanda teed, kui vaja.

export async function getCourses(timetableId) {
    // Muudame "api/ac" → "/ac", et proxy suunaks https://tunniplaan.taltech.ee/tt/api/public/ac
    const res = await fetch("/ac?ttId=" + timetableId + "&term=");
    if (!res.ok) {
      throw new Error("getCourses error: " + res.status);
    }
    const json = await res.json();
    return json["subjects"];
  }
  
  // Kui tahad seda funktsiooni kasutada, ekspordi nimeliselt.
  // NB! Eeldab getTimetables importi. 
  export async function getTimetablesInRange(startDate, endDate) {
    const timetables = await getTimetables(); 
    return timetables.filter((timetable) => {
      const currentSessDate = new Date(timetable["currentSessDate"]);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return (
        currentSessDate.getTime() >= start.getTime() &&
        currentSessDate.getTime() <= end.getTime()
      );
    });
  }
  
  /* 
    // IIFE testkood GitHubist:
    (async () => {
      const timetables = await getTimetables();
      console.log(timetables);
      // List all timetables
      timetables.forEach(timetable => {
        console.log("currentId:", timetable["currentId"], 
                    "currentName:", timetable["currentName"], 
                    "currentNameEn:", timetable["currentNameEn"], 
                    "currentSessDate:", timetable["currentSessDate"]);
      });
    })();
  */
  