import { getFidelityPrograms } from './api';

async function loadFidelityPrograms(userId) {
    const programs = await getFidelityPrograms(userId);
    const container = document.getElementById('programs-container');
    container.innerHTML = programs.map(program => `
        <div class="program">
            <h3>${program.name}</h3>
            <p>Progresso: ${program.progress} / ${program.maxStamps}</p>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadFidelityPrograms('user-id-exemplo');
});
