import * as alt from 'alt-server';
import { useApi } from '@Server/api/index.js';
import { getGridCoordinates, getWeatherForPlayer } from '../index.js';

function useWeatherAPI() {
    const grid = {
        getCoords: getGridCoordinates,
    };

    const player = {
        getWeather: getWeatherForPlayer,
    };

    return {
        grid,
        player,
    };
}

declare global {
    export interface ServerPlugin {
        ['ascended-weather-api']: ReturnType<typeof useWeatherAPI>;
    }
}

useApi().register('ascended-weather-api', useWeatherAPI());
