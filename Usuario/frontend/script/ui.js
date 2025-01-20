import { getPrograms, addPoints } from "./loyalty.js";

export async function displayPrograms(userId) {
  const programs = await getPrograms(userId);
  const container = document.getElementById("program-list");

  container.innerHTML = Object.entries(programs)
    .map(
      ([programId, program]) =>
        `<div>${program.programName}: ${program.points} pontos</div>`
    )
    .join("");
}

export async function addPointsAndRefresh(userId, programId, points) {
  await addPoints(userId, programId, points);
  displayPrograms(userId);
}
