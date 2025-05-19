/**
 * Output JSON:
 * [
 *   {
 *      "departmentId": number,
 *      "nameEt": string,
 *      "nameEn": string,
 *      "curriculums": [
 *        {
 *          "code": string,
 *          "nameEt": string,
 *          "nameEn": string,
 *          "studentGroups": [
 *            {
 *              "id": number,
 *              "code": string,
 *              "curriculumVersionId": number,
 *              "location": string,
 *              "locationEn": string,
 *              "specNameEt": string,
 *              "specNameEn": string
 *            },
 *            ...
 *          ]
 *        },
 *        ...
 *      ]
 *   },
 *   ...
 * ]
 *
 */
export async function getDepartments(timetableId) {
    const res = await fetch("/departments?ttId=" + timetableId)
    ;
    const json = await res.json();
    return json["departments"];
}
