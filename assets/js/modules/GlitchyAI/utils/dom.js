/**
 * dom.js
 * Utility per la manipolazione del DOM.
 */

/**
 * Crea un elemento DOM con una classe e un contenuto testuale opzionali.
 * @param {string} tag - Il tag HTML dell'elemento da creare (es. 'div', 'button').
 * @param {string} [className] - La classe CSS da assegnare all'elemento.
 * @param {string} [textContent] - Il contenuto testuale dell'elemento.
 * @returns {HTMLElement} L'elemento DOM creato.
 */
export function mk(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (textContent !== undefined) {
        el.textContent = textContent;
    }
    return el;
}