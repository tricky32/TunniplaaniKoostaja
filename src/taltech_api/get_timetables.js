/**
 * Output JSON:
 * [
 *   {
 *     "currentId": number,
 *     "currentName": string,
 *     "currentNameEn": string,
 *     "currentSessDate": string,
 *   },
 *   ...
 * ]
 *
 * Example output:
 * [
 *   {
 *     "currentId": 3,
 *     "currentName": '2023/2024 kevad',
 *     "currentNameEn": '2023/2024  Spring',
 *     "currentSessDate": '2024-05-20',
 *     "nextId": null,
 *     "nextName": null,
 *     "nextNameEn": null,
 *     "isNextPublished": null
 *   }
 * ]
 */
export async function getTimetables() {
    // "api/timetables" → "/timetables"
    const res = await fetch("/timetables");
    if (!res.ok) {
      throw new Error("getTimetables error: " + res.status);
    }
    const json = await res.json();
    // GitHubis return [json], aga eeldusel, et server tegelikult saadab massiivi, 
    //   me pigem tagastaks otse massiivi. 
    // Muidu, kui server saadab 1 ainukest objekti, Giti kood pidi tegema [json].
    return Array.isArray(json) ? json : [json];
  }
