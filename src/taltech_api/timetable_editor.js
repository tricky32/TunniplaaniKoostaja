export function removeEmptyWeekdays(scheduleJson) {
    return {
        weekDays: scheduleJson["weekDays"].filter(
            (weekDay) => weekDay["rows"].length > 0
        ),
    };
}

/**
 * Removes layer which were previously combined using combineLayers().
 *
 * For example 'currentJson = removeStudentGroup(currentJson, "IACB22")',
 * where IACB22 is 2nd student group in 2nd semester in curriculum called 'Riistvaraarendus ja programmeerimine'
 *
 * Returnes new schedule with made modifications.
 */
export function removeStudentGroup(scheduleJson, studentGroupId) {
    let newWeekDays = scheduleJson["weekDays"].map((weekDay) => ({
        ...weekDay,
        rows: weekDay["rows"].filter((row) => {
            const sgs = row["sgs"]
                ? row["sgs"].split(",").map((sg) => sg.trim())
                : [];

            return !sgs.includes(studentGroupId);
        }),
    }));
    console.log(newWeekDays);

    newWeekDays = newWeekDays.filter(
        (
            weekDay = {
                weekDays: [
                    {
                        dow: "",
                        rows: [
                            {
                                startTime: "",
                                endTime: "",
                                subjectName: "",
                                weekCodes: [],
                            },
                        ],
                    },
                ],
            }
        ) => weekDay["rows"].length > 0
    );

    return {
        weekDays: newWeekDays,
    };
}

/**
 * Combines two programs' JSON, fetched from TalTech's API, into one.
 *
 * For example 'currentJson = combineSchedules(currentJson, fetchedJson)',
 * where fetchedJson is fetched from TalTech
 *
 * Returnes new combined schedule.
 */
export function combineSchedules(scheduleJson, otherScheduleJson) {
    let weekDays = [
        { dow: 1, rows: [] },
        { dow: 2, rows: [] },
        { dow: 3, rows: [] },
        { dow: 4, rows: [] },
        { dow: 5, rows: [] },
        { dow: 6, rows: [] },
        { dow: 7, rows: [] },
    ];

    weekDays = weekDays.map((weekDay, index) => {
        let newRows = [];
        if (
            scheduleJson["weekDays"].some(
                (day) => day["dow"] === weekDay["dow"]
            )
        ) {
            newRows = newRows.concat(
                scheduleJson["weekDays"].find(
                    (day) => day["dow"] === weekDay["dow"]
                )["rows"]
            );
        }

        if (
            otherScheduleJson["weekDays"].some(
                (day) => day["dow"] === weekDay["dow"]
            )
        ) {
            newRows = newRows.concat(
                otherScheduleJson["weekDays"].find(
                    (day) => day["dow"] === weekDay["dow"]
                )["rows"]
            );
        }

        return {
            dow: weekDay["dow"],
            rows: newRows,
        };
    });

    weekDays = weekDays.filter((weekDay) => weekDay["rows"].length > 0);

    return {
        weekDays: weekDays,
    };
}

/**
 * Removes a reoccurring subject.
 *
 * For example 'currentJson = removeSubject(currentJson, "IAX0043")',
 * where IAX0043 is subject called "Arvutid".
 *
 * Returnes new schedule with made modifications.
 */
export function removeSubject(scheduleJson, subjectCode) {
    let newWeekDays = scheduleJson["weekDays"].map((weekDay) => ({
        ...weekDay,
        rows: weekDay["rows"].filter(
            (row) => row["subjectCode"] !== subjectCode
        ),
    }));

    newWeekDays = newWeekDays.filter((weekDay) => weekDay["rows"].length > 0);

    return {
        weekDays: newWeekDays,
    };
}
