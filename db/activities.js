const client = require("./client");

// database functions
async function getAllActivities() {
  try {
    const { rows: activities } = await client.query(
      `
      SELECT *
      FROM activities;
    `
    );

    return activities;
  } catch (error) {
    console.log(error)
  }
}

async function getActivityById(id) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      SELECT id, name, description
      FROM activities
      WHERE id=$1
    `,
      [id]
    );

    if (!activity) {
      return null;
    }

    return activity;
  } catch (error) {
    console.log(error)
  }
}

async function getActivityByName(name) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      SELECT *
      FROM activities
      WHERE name=$1
    `,
      [name]
    );

    if (!activity) {
      return null;
    }

    return activity;
  } catch (error) {
    console.log(error)
  }
}

// select and return an array of all activities
async function attachActivitiesToRoutines(routines) {
  // no side effects
  const routinesToReturn = [...routines];
  const binds = routines.map((_, index) => `$${index + 1}`).join(", ");
  // $1, $2...
  const routineIds = routines.map((routine) => {
    return routine.id;
  });

  // if (!routineIds?.length) return []; same thing as below 


  if (!routineIds || routineIds.length===0){ return[]};

  try {
    // get the activities, JOIN with routine_activities (so we can get a routineId), and only those that have those routine ids on the routine_activities join
    const { rows: activities } = await client.query(
      `
      SELECT activities.*, routine_activities.duration, routine_activities.count, routine_activities.id AS "routineActivityId", routine_activities."routineId"
      FROM activities 
      JOIN routine_activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" IN (${binds});
    `,
      routineIds
    );

    // loop over the routines
    for (const routine of routinesToReturn) {
      // filter the activities to only include those that have this routineId
      const activitiesToAdd = activities.filter(
        (activity) => activity.routineId === routine.id
      );
      // attach the activities to each single routine
      routine.activities = activitiesToAdd;
    }
    return routinesToReturn;
  } catch (error) {
    console.log(error)
  }
}

// return the new activity
async function createActivity({ name, description }) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      INSERT INTO activities(name, description) 
      VALUES($1, $2) 
      ON CONFLICT (name) DO NOTHING 
      RETURNING *;
    `,
      [name, description]
    );

    return activity;
  } catch (error) {
    console.log(error)
  }
}

// don't try to update the id
// do update the name and description
// return the updated activity
async function updateActivity(params) {
  const { id, ...fields } = params
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }
  try {
    const request = await client.query(
      `
    UPDATE activities
    SET ${setString}
    WHERE id=${id}
    RETURNING *;
    `,
      Object.values(fields)
    );
const {
  rows: [activity],
} = request
    return activity;
  } catch (error) {
    console.log("DATABASE ERROR:", error)
  }
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
};
