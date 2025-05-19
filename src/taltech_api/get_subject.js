export async function getSubject(timetableId, subjectId) {
    const res = await fetch("/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        mode: "OTHER",
        page: 1,
        size: 1000,
        subjectId: subjectId,
        ttId: timetableId,
      }),
    });
  
    if (!res.ok) {
      throw new Error("getSubject error: " + res.status);
    }
    return await res.json();
  }