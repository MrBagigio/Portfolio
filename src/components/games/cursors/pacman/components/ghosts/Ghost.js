// assets/js/modules/cursors/pacman/components/ghosts/Ghost.js
export class Ghost {
    constructor(x, y, radius = 10) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.isDead = false;
        this.isHunter = false;
    }

    // CORREZIONE: Aggiornata la firma del metodo base per coerenza.
    // Le classi figlie ora devono restituire un array di azioni.
    update(deltaTime, player, mouse, gameState, dependencies) {
        // La logica è nelle classi figlie
        return []; // Restituisce sempre un iterabile vuoto di default
    }

    draw(ctx) {
        // La logica è nelle classi figlie
    }

    markForRemoval() {
        this.isDead = true;
    }
}