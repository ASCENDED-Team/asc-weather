import { Weathers } from '@Shared/data/weathers.js';

export const WeatherConfig = {
    weathers: [
        'EXTRASUNNY',
        'CLEAR',
        'CLOUDS',
        'OVERCAST',
        'RAIN',
        'THUNDER',
        'RAIN',
        'FOG',
        'CLEARING',
        'XMAS',
        'SNOW',
        'BLIZZARD',
    ] as Weathers[],
    timeBetweenUpdates: 60000 * 15,
    timeToTransition: 15,
    debug: true,
};
