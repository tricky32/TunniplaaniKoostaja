// scheduleOptimizer.js
// This improved version adds strict constraints to prevent overlapping classes
// for the same student groups or teachers.

export function optimizeSchedule(rawData) {
  // Create deep copy of the data to avoid modifying the original
  let solution = JSON.parse(JSON.stringify(rawData));

  // Normalize week codes to numbers
  solution = solution.map((event) => {
    if (event.weekCodes && Array.isArray(event.weekCodes)) {
      event.normalizedWeeks = event.weekCodes.map(parseWeekCode).filter((num) => num !== null);
    } else {
      event.normalizedWeeks = [];
    }
    return event;
  });

  // Cost function evaluates the quality of a solution
  function cost(sol) {
    let totalPenalty = 0;
    
    // Group events by day, group, and teacher
    const dayGroups = groupEventsByDayAndGroup(sol);
    const dayTeachers = groupEventsByDayAndTeacher(sol);
    
    // Apply massive penalty for student group overlaps
    Object.keys(dayGroups).forEach(dayKey => {
      Object.keys(dayGroups[dayKey]).forEach(groupKey => {
        const dayEvents = dayGroups[dayKey][groupKey];
        
        // Evaluate only if there's at least 1 class on that day
        if (dayEvents.length === 0) return;
        
        // Sort events by start time
        dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        
        // Check for overlaps within this group's schedule
        for (let i = 0; i < dayEvents.length; i++) {
          for (let j = i + 1; j < dayEvents.length; j++) {
            // Only check for overlaps if they share weeks
            if (shareWeeks(dayEvents[i], dayEvents[j]) && eventsOverlap(dayEvents[i], dayEvents[j])) {
              // Extremely high penalty for overlapping events
              totalPenalty += 10000;
            }
          }
        }
        
        // 1. Penalty for single lonely class in a day
        if (dayEvents.length === 1) {
          totalPenalty += 30;
        }
        
        // 2. Penalty for breaks that are too long (over 2 hours = 120 min)
        for (let i = 1; i < dayEvents.length; i++) {
          const prevEndTime = timeToMinutes(dayEvents[i-1].endTime);
          const currStartTime = timeToMinutes(dayEvents[i].startTime);
          const gap = currStartTime - prevEndTime;
          
          if (gap > 120) {
            totalPenalty += Math.floor(gap / 30) * 3;  // 3 points per 30 minutes over 2 hours
          } else if (gap < 15) {
            // Penalty for breaks that are too short
            totalPenalty += (15 - gap) * 50;  // 50 points per minute under 15 min
          }
        }
        
        // 3. Penalty if day is too long (over 8 hours)
        if (dayEvents.length > 1) {
          const firstStart = timeToMinutes(dayEvents[0].startTime);
          const lastEnd = timeToMinutes(dayEvents[dayEvents.length-1].endTime);
          const dayLength = lastEnd - firstStart;
          
          if (dayLength > 480) {  // Over 8 hours = 480 min
            totalPenalty += Math.floor(dayLength / 60) * 2;  // 2 points per hour
          }
        }
        
        // 4. Penalty if practicals come before lectures
        const lectureIndices = dayEvents
          .map((e, i) => isLecture(e) ? i : -1)
          .filter(i => i !== -1);
          
        const practicalIndices = dayEvents
          .map((e, i) => isPractical(e) ? i : -1)
          .filter(i => i !== -1);
        
        if (lectureIndices.length > 0 && practicalIndices.length > 0) {
          const firstLecture = Math.min(...lectureIndices);
          const firstPractical = Math.min(...practicalIndices);
          
          if (firstPractical < firstLecture) {
            totalPenalty += 25;  // High penalty for practical before lecture
          }
        }
      });
    });
    
    // Apply massive penalty for teacher overlaps
    Object.keys(dayTeachers).forEach(dayKey => {
      Object.keys(dayTeachers[dayKey]).forEach(teacherKey => {
        const teacherEvents = dayTeachers[dayKey][teacherKey];
        
        // Check for overlaps in teacher's schedule
        for (let i = 0; i < teacherEvents.length; i++) {
          for (let j = i + 1; j < teacherEvents.length; j++) {
            // Only check for overlaps if they share weeks
            if (shareWeeks(teacherEvents[i], teacherEvents[j]) && 
                eventsOverlap(teacherEvents[i], teacherEvents[j])) {
              // Extremely high penalty for teacher double-booking
              totalPenalty += 10000;
            }
          }
        }
      });
    });

    // Individual event penalties
    sol.forEach((event) => {
      // Week range should be 1-16
      if (event.normalizedWeeks.length > 0) {
        let minWeek = Math.min(...event.normalizedWeeks);
        let maxWeek = Math.max(...event.normalizedWeeks);
        if (minWeek > 1 || maxWeek < 16) {
          totalPenalty += 10;
        }
      }
      
      // Based on class type
      if (isLecture(event)) {
        if (timeToMinutes(event.startTime) > 720) totalPenalty += 5;
      }
      
      if (isPractical(event)) {
        if (timeToMinutes(event.startTime) < 720) totalPenalty += 5;
      }
      
      // Master's courses should be later
      if (isMastersGroup(event)) {
        if (timeToMinutes(event.startTime) < 900) {  // Before 15:00
          totalPenalty += 7;
        }
      }
    });
    
    return totalPenalty;
  }

  // Helper function to check if two events share any weeks
  function shareWeeks(event1, event2) {
    // If either event doesn't have week codes, assume they could overlap
    if (!event1.weekCodes || !event2.weekCodes || 
        !Array.isArray(event1.weekCodes) || !Array.isArray(event2.weekCodes)) {
      return true;
    }

    // Extract numeric week values
    const weeks1 = event1.weekCodes.map(parseWeekCode).filter(w => w !== null);
    const weeks2 = event2.weekCodes.map(parseWeekCode).filter(w => w !== null);

    // If either has no weeks specified, assume they could overlap
    if (weeks1.length === 0 || weeks2.length === 0) return true;

    // Check for any common weeks
    return weeks1.some(w => weeks2.includes(w));
  }

  // Helper functions to check event types
  function isLecture(event) {
    if (!event.type) return false;
    const type = event.type.toLowerCase();
    return type.includes("loeng") || type.includes("lh") || 
           (type.includes("l") && !type.includes("p"));
  }
  
  function isPractical(event) {
    if (!event.type) return false;
    const type = event.type.toLowerCase();
    return type.includes("praktikum") || type.includes("harjutus") || 
           type.includes("p");
  }
  
  function isMastersGroup(event) {
    if (!event.sgs) return false;
    const sgs = typeof event.sgs === "string" ? event.sgs : 
                (event.sgs.code ? event.sgs.code : "");
    return sgs.toUpperCase().includes("M");
  }

  // Check if two events overlap in time
  function eventsOverlap(e1, e2) {
    const start1 = timeToMinutes(e1.startTime);
    const end1 = timeToMinutes(e1.endTime);
    const start2 = timeToMinutes(e2.startTime);
    const end2 = timeToMinutes(e2.endTime);
    
    // Add buffer for break between classes (15 minutes minimum)
    return !(end1 + 15 <= start2 || end2 + 15 <= start1);
  }

  // Function to adjust event times according to constraints
  function adjustEvent(event) {
    let start = timeToMinutes(event.startTime);
    let duration = timeToMinutes(event.endTime) - start;

    // Round start time to nearest 15 minutes
    start = Math.round(start / 15) * 15;

    // Adjust based on class type
    if (isLecture(event)) {
      if (start > 720) { 
        let shift = Math.min(start - 600, 30);
        start -= shift;
      }
    }
    
    if (isPractical(event)) {
      if (start < 720) {
        let shift = Math.min(720 - start, 30);
        start += shift;
      }
    }
    
    // Master's programs later
    if (isMastersGroup(event)) {
      if (start < 900) { // Before 15:00
        let shift = Math.min(900 - start, 45);
        start += shift;
      }
    }
    
    // Keep within working hours
    if (start < 480) start = 480;  // Not earlier than 8:00
    if (start + duration > 1200) start = 1200 - duration;  // Not later than 20:00

    event.startTime = minutesToTime(start);
    event.endTime = minutesToTime(start + duration);
    return event;
  }

  // Implementation of simulated annealing algorithm
  let bestSolution = JSON.parse(JSON.stringify(solution));
  let bestCost = cost(solution);
  let currentSolution = JSON.parse(JSON.stringify(solution));
  let currentCost = bestCost;
  
  const initialTemperature = 200;
  let temperature = initialTemperature;
  const coolingRate = 0.97;
  const iterations = 5000; // Increased iterations for better results
  
  console.log("Starting optimization with initial cost:", bestCost);
  
  for (let i = 0; i < iterations; i++) {
    // Create a neighbor solution by adjusting random events
    let neighbor = JSON.parse(JSON.stringify(currentSolution));
    
    // Method 1: Adjust a single event
    let index = Math.floor(Math.random() * neighbor.length);
    neighbor[index] = adjustEvent(neighbor[index]);
    
    // Method 2: Swap events within the same day if helpful
    if (Math.random() < 0.5) {
      const eventsByDay = {};
      neighbor.forEach((event, idx) => {
        const day = event.dow || -1;
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(idx);
      });
      
      // Pick a random day
      const days = Object.keys(eventsByDay).filter(day => eventsByDay[day].length >= 2);
      if (days.length > 0) {
        const day = days[Math.floor(Math.random() * days.length)];
        const indices = eventsByDay[day];
        
        // Pick two random events from this day
        const idx1 = indices[Math.floor(Math.random() * indices.length)];
        let idx2 = indices[Math.floor(Math.random() * indices.length)];
        if (idx1 !== idx2) {
          const e1 = neighbor[idx1];
          const e2 = neighbor[idx2];
          
          // Prioritize swapping if lecture is after practical
          if ((isLecture(e1) && isPractical(e2) && 
               timeToMinutes(e1.startTime) > timeToMinutes(e2.startTime)) ||
              (isLecture(e2) && isPractical(e1) && 
               timeToMinutes(e2.startTime) > timeToMinutes(e1.startTime))) {
            
            // Store original times
            const start1 = e1.startTime;
            const end1 = e1.endTime;
            const start2 = e2.startTime;
            const end2 = e2.endTime;
            
            // Calculate durations
            const duration1 = timeToMinutes(end1) - timeToMinutes(start1);
            const duration2 = timeToMinutes(end2) - timeToMinutes(start2);
            
            // Swap start times and recalculate end times
            e1.startTime = start2;
            e1.endTime = minutesToTime(timeToMinutes(start2) + duration1);
            
            e2.startTime = start1;
            e2.endTime = minutesToTime(timeToMinutes(start1) + duration2);
          }
        }
      }
    }

    // Calculate cost of neighbor solution
    const neighborCost = cost(neighbor);
    
    // Decide whether to accept the new solution
    if (neighborCost < currentCost) {
      currentSolution = neighbor;
      currentCost = neighborCost;
      
      if (neighborCost < bestCost) {
        bestSolution = neighbor;
        bestCost = neighborCost;
        
        // Log progress periodically
        if (i % 500 === 0 || bestCost < 100) {
          console.log(`Iteration ${i}: Found better solution with cost ${bestCost}`);
        }
      }
    } else {
      // Accept worse solutions with decreasing probability (simulated annealing)
      const acceptanceProbability = Math.exp((currentCost - neighborCost) / temperature);
      if (Math.random() < acceptanceProbability) {
        currentSolution = neighbor;
        currentCost = neighborCost;
      }
    }
    
    // Cool down temperature
    temperature *= coolingRate;
  }
  
  console.log("Optimization finished with best cost:", bestCost);
  
  // If the best solution still has overlaps, try a greedy fix
  if (bestCost > 1000) {
    console.log("Attempting greedy overlap resolution...");
    bestSolution = resolveOverlaps(bestSolution);
    bestCost = cost(bestSolution);
    console.log("After overlap resolution, cost:", bestCost);
  }
  
  return bestSolution;
}

// Greedy algorithm to resolve remaining overlaps
function resolveOverlaps(events) {
  const result = JSON.parse(JSON.stringify(events));
  const dayGroups = groupEventsByDayAndGroup(result);
  
  // Process each day and group
  Object.keys(dayGroups).forEach(day => {
    Object.keys(dayGroups[day]).forEach(group => {
      const groupEvents = dayGroups[day][group];
      if (groupEvents.length <= 1) return;
      
      // Sort by start time
      groupEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      
      // Fix overlaps by pushing events forward
      for (let i = 1; i < groupEvents.length; i++) {
        const prev = groupEvents[i-1];
        const curr = groupEvents[i];
        
        // Check if they overlap and share weeks
        if (shareWeeks(prev, curr)) {
          const prevEnd = timeToMinutes(prev.endTime);
          const currStart = timeToMinutes(curr.startTime);
          
          // If overlap or insufficient break, push current event later
          if (prevEnd + 15 > currStart) {
            const newStart = prevEnd + 15; // 15 min break
            const duration = timeToMinutes(curr.endTime) - currStart;
            
            // Update the event in the original list
            const eventIndex = result.findIndex(e => 
              e.dow === Number(day) && 
              e.startTime === curr.startTime && 
              e.endTime === curr.endTime &&
              e.subjectCode === curr.subjectCode
            );
            
            if (eventIndex !== -1) {
              result[eventIndex].startTime = minutesToTime(newStart);
              result[eventIndex].endTime = minutesToTime(newStart + duration);
              
              // Update the current working copy too
              curr.startTime = minutesToTime(newStart);
              curr.endTime = minutesToTime(newStart + duration);
            }
          }
        }
      }
    });
  });
  
  // Do the same for teachers
  const dayTeachers = groupEventsByDayAndTeacher(result);
  Object.keys(dayTeachers).forEach(day => {
    Object.keys(dayTeachers[day]).forEach(teacher => {
      const teacherEvents = dayTeachers[day][teacher];
      if (teacherEvents.length <= 1) return;
      
      // Sort by start time
      teacherEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      
      // Fix overlaps by pushing events forward
      for (let i = 1; i < teacherEvents.length; i++) {
        const prev = teacherEvents[i-1];
        const curr = teacherEvents[i];
        
        if (shareWeeks(prev, curr)) {
          const prevEnd = timeToMinutes(prev.endTime);
          const currStart = timeToMinutes(curr.startTime);
          
          if (prevEnd + 15 > currStart) {
            const newStart = prevEnd + 15; // 15 min break
            const duration = timeToMinutes(curr.endTime) - currStart;
            
            const eventIndex = result.findIndex(e => 
              e.dow === Number(day) && 
              e.startTime === curr.startTime && 
              e.endTime === curr.endTime &&
              e.subjectCode === curr.subjectCode
            );
            
            if (eventIndex !== -1) {
              result[eventIndex].startTime = minutesToTime(newStart);
              result[eventIndex].endTime = minutesToTime(newStart + duration);
            }
          }
        }
      }
    });
  });
  
  return result;
}

// Helper function to check if two events share any weeks
function shareWeeks(event1, event2) {
  // If either event doesn't have week codes, assume they could overlap
  if (!event1.weekCodes || !event2.weekCodes || 
      !Array.isArray(event1.weekCodes) || !Array.isArray(event2.weekCodes)) {
    return true;
  }

  // Extract numeric week values
  const weeks1 = event1.weekCodes.map(parseWeekCode).filter(w => w !== null);
  const weeks2 = event2.weekCodes.map(parseWeekCode).filter(w => w !== null);

  // If either has no weeks specified, assume they could overlap
  if (weeks1.length === 0 || weeks2.length === 0) return true;

  // Check for any common weeks
  return weeks1.some(w => weeks2.includes(w));
}

// Converts week code (e.g. "NADAL_8") to number (8)
function parseWeekCode(weekCode) {
  if (typeof weekCode === "string" && weekCode.startsWith("NADAL_")) {
    const num = parseInt(weekCode.replace("NADAL_", ""), 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

// Converts "HH:MM" to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(":").map(Number);
  return hh * 60 + (mm || 0);
}

// Converts minutes since midnight to "HH:MM" format
function minutesToTime(totalMins) {
  const hh = String(Math.floor(totalMins / 60)).padStart(2, "0");
  const mm = String(totalMins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Groups events by day and student group
function groupEventsByDayAndGroup(events) {
  const result = {};
  
  events.forEach(event => {
    const day = event.dow || -1;
    if (!result[day]) {
      result[day] = {};
    }
    
    // Transform sgs based on its type
    let groups = [];
    if (typeof event.sgs === "string") {
      groups = event.sgs.split(",").map(g => g.trim());
    } else if (Array.isArray(event.sgs)) {
      groups = event.sgs.map(g => typeof g === "string" ? g : (g.code || "")).filter(Boolean);
    } else if (event.sgs && event.sgs.code) {
      groups = [event.sgs.code];
    } else {
      groups = ["unknown"];
    }
    
    // Add event to each group's schedule
    groups.forEach(group => {
      if (!result[day][group]) {
        result[day][group] = [];
      }
      result[day][group].push(event);
    });
  });
  
  return result;
}

// Groups events by day and teacher
function groupEventsByDayAndTeacher(events) {
  const result = {};
  
  events.forEach(event => {
    const day = event.dow || -1;
    if (!result[day]) {
      result[day] = {};
    }
    
    // Extract teacher names
    let teachers = [];
    if (event.teachers && Array.isArray(event.teachers)) {
      teachers = event.teachers.map(t => t.teacherName || "").filter(Boolean);
    } else if (event.teachers && typeof event.teachers === "string") {
      teachers = [event.teachers];
    }
    
    // Skip if no teachers
    if (teachers.length === 0) return;
    
    // Add event to each teacher's schedule
    teachers.forEach(teacher => {
      if (!result[day][teacher]) {
        result[day][teacher] = [];
      }
      result[day][teacher].push(event);
    });
  });
  
  return result;
}