// assets/js/setup/systemInfo.js

export function setupSystemInfo() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return; // Se non c'è l'orologio, non fare nulla

    // Funzione per aggiornare l'orologio
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Aggiorna l'orologio immediatamente e poi ogni secondo
    updateClock();
    setInterval(updateClock, 1000);
}