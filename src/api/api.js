// src/api/api.js
export async function getDepartments() {
    // Eeldame, et see endpoint eksisteerib: /departments
    // Kus saad array [{ departmentId: 50001, name: "...", ...}, ...]
    const response = await fetch("/departments"); // CRA proxy => tunniplaan.taltech.ee/tt/api/public/departments
    if (!response.ok) {
      throw new Error("Viga osakondade laadimisel: " + response.status);
    }
    return response.json();
  }
  
  export async function search(params) {
    const response = await fetch("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error("Viga search päringus: " + response.status);
    }
    return response.json();
  }
  