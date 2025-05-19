const { getTimetables } = require('./get_timetables');
const { getDepartments } = require('./get_departments');
const { getProgram } = require('./get_program');

(async () => {
    const timetables = await getTimetables();
    console.log(timetables);

    const chosenTimetableId = timetables[0]["currentId"]

    const departments = await getDepartments(chosenTimetableId);
    console.log(JSON.stringify(departments, null, 2));

    departments.forEach(department => {
        console.log("departmentId:", department["departmentId"], "nameEt:", department["nameEt"]);

        department["curriculums"].forEach(curriculum => {
            console.log("   ", "code:", curriculum["code"], "nameEt:", curriculum["nameEt"]);

            curriculum["studentGroups"].forEach(studentGroup => {
                console.log("       ", "id:", studentGroup["id"], "code:", studentGroup["code"], "curriculumVersionId:", studentGroup["curriculumVersionId"], "nameEt:", studentGroup["specNameEt"]);
            });
        });
    });
    
    const chosenDepartmentID = departments[0]["departmentId"];
    const chosenCurriculumCode = departments[0]["curriculums"][0]["code"];
    const chosenProgramID = departments[0]["curriculums"][0]["studentGroups"][0]["id"];
    const chosenCurriculumVersionID = departments[0]["curriculums"][0]["studentGroups"][0]["curriculumVersionId"];

    console.log("chosenDepartmentID:", chosenDepartmentID);
    console.log("chosenCurriculumCode:", chosenCurriculumCode);
    console.log("chosenProgramID:", chosenProgramID);
    console.log("chosenCurriculumVersionID:", chosenCurriculumVersionID);

    const program = await getProgram(
        chosenProgramID,
        chosenCurriculumVersionID,
        chosenDepartmentID,
        chosenTimetableId
    );
    
    console.log(JSON.stringify(program, null, 2));
})();