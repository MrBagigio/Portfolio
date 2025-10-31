// i18n.js - Internationalization
const translations = {
    it: {
        weather: {
            clear: 'soleggiato',
            clouds: 'nuvoloso',
            rain: 'piovoso',
            drizzle: 'pioggerellina',
            thunderstorm: 'temporale',
            snow: 'nevoso',
            mist: 'nebbioso',
            fog: 'nebbia'
        }
    },
    en: {
        weather: {
            clear: 'sunny',
            clouds: 'cloudy',
            rain: 'rainy',
            drizzle: 'drizzling',
            thunderstorm: 'thunderstorm',
            snow: 'snowy',
            mist: 'misty',
            fog: 'foggy'
        }
    }
};

export class I18n {
    constructor(language = 'it') {
        this.language = language;
    }

    translateWeatherCondition(main, description) {
        const langTranslations = translations[this.language]?.weather || translations.it.weather;
        return langTranslations[main.toLowerCase()] || description.toLowerCase();
    }

    setLanguage(language) {
        this.language = language;
    }
}