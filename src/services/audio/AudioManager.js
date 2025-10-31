// AudioManager.js - Manages audio playback
export class AudioManager {
    constructor() {
        this.audioElements = {};
        this.preloadSounds();
    }

    preloadSounds() {
        const sounds = {
            coin: 'coin-audio',
            transition: 'transition-audio',
            hover: 'preloader-hover-sound',
            notify: 'preloader-click-sound'
        };

        Object.entries(sounds).forEach(([name, id]) => {
            let audio = document.getElementById(id);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = id;
                audio.style.display = 'none';
                audio.preload = 'auto';
                document.body.appendChild(audio);
            }
            this.audioElements[name] = audio;
        });
    }

    async playSound(name) {
        const audio = this.audioElements[name];
        if (!audio || !audio.src && audio.children.length === 0) {
            return false;
        }

        try {
            audio.currentTime = 0;
            await audio.play();
            return true;
        } catch (error) {
            console.debug('Audio play failed:', error.message);
            return false;
        }
    }
}