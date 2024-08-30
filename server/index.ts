import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Weathers } from '@Shared/data/weathers.js';
import { WeatherConfig } from './src/config.js';

const Rebar = useRebar();
const RebarEvents = Rebar.events.useEvents();

// Define the grid size (adjust as needed)
const GRID_SIZE = 8; // 16x16 grid
const GRID_CELL_SIZE = 1000; // Size of each grid cell in game units

type WeatherCell = {
    weather: Weathers;
    forecast: Weathers[];
    temperature: number;
};

type PlayerWeatherData = {
    lastGridX: number;
    lastGridY: number;
};

const weatherGrid: WeatherCell[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() =>
        Array(GRID_SIZE)
            .fill(null)
            .map(() => ({
                weather: 'CLEAR' as Weathers,
                forecast: [...WeatherConfig.weathers],
                temperature: 20, // Default temperature
            })),
    );

const playerWeatherData = new Map<alt.Player, PlayerWeatherData>();

function debugLog(message: string) {
    if (WeatherConfig.debug) {
        alt.log(`[DEBUG] ${message}`);
    }
}

export function getGridCoordinates(position: alt.Vector3): [number, number] {
    const x = Math.floor((position.x + 4000) / GRID_CELL_SIZE);
    const y = Math.floor((position.y + 4000) / GRID_CELL_SIZE);
    return [Math.max(0, Math.min(x, GRID_SIZE - 1)), Math.max(0, Math.min(y, GRID_SIZE - 1))];
}

function generateTemperature(weather: Weathers): number {
    switch (weather) {
        case 'CLEAR':
            return Math.floor(Math.random() * 15) + 20; // 20°C to 35°C
        case 'RAIN':
            return Math.floor(Math.random() * 10) + 15; // 15°C to 25°C
        case 'SNOW':
            return Math.floor(Math.random() * 5); // 0°C to 5°C
        // For Other Weathers, add temperature here
        default:
            return Math.floor(Math.random() * 10) + 10; // 10°C to 20°C
    }
}

function updateGridCellWeather(x: number, y: number) {
    const cell = weatherGrid[x][y];
    const oldWeather = cell.forecast.shift();
    if (oldWeather) {
        cell.forecast.push(oldWeather);
    }
    cell.weather = cell.forecast[0] || 'CLEAR';
    cell.temperature = generateTemperature(cell.weather);
    debugLog(`Updated weather for Grid Cell [${x}, ${y}]: Weather=${cell.weather}, Temperature=${cell.temperature}°C`);
}

function updateWeather() {
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            updateGridCellWeather(x, y);
        }
    }

    for (let player of alt.Player.all) {
        if (Rebar.player.useStatus(player).hasCharacter()) {
            updatePlayerWeather(player);
        }
    }
}

function updatePlayerWeather(player: alt.Player) {
    const [gridX, gridY] = getGridCoordinates(player.pos);
    const cell = weatherGrid[gridX][gridY];
    Rebar.player.useWorld(player).setWeather(cell.weather, WeatherConfig.timeToTransition);

    const playerData = playerWeatherData.get(player);

    if (!playerData || playerData.lastGridX !== gridX || playerData.lastGridY !== gridY) {
        debugLog(`Player ${player.id} moved to new Grid Cell [${gridX}, ${gridY}]`);
        debugLog(`Setting Weather: ${cell.weather}, Temperature: ${cell.temperature}°C`);

        playerWeatherData.set(player, { lastGridX: gridX, lastGridY: gridY });
    }
}

function handleCharacterSelect(player: alt.Player) {
    updatePlayerWeather(player);
}

function initializeWeatherGrid() {
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const randomizedForecast = [...WeatherConfig.weathers].sort(() => Math.random() - 0.5);

            const initialWeather = randomizedForecast[0] || 'CLEAR';

            weatherGrid[x][y] = {
                weather: initialWeather,
                forecast: randomizedForecast,
                temperature: generateTemperature(initialWeather),
            };

            debugLog(
                `Initialized Grid Cell [${x}, ${y}] with Weather: ${initialWeather}, Temperature: ${weatherGrid[x][y].temperature}°C`,
            );
        }
    }
}

export function getWeatherForPlayer(player: alt.Player): {
    weather: Weathers;
    forecast: Weathers[];
    temperature: number;
} {
    const [gridX, gridY] = getGridCoordinates(player.pos);
    const cell = weatherGrid[gridX][gridY];
    return {
        weather: cell.weather,
        forecast: cell.forecast,
        temperature: cell.temperature,
    };
}

initializeWeatherGrid();

RebarEvents.on('character-bound', handleCharacterSelect);

alt.setInterval(updateWeather, WeatherConfig.timeBetweenUpdates);

alt.setInterval(() => {
    for (let player of alt.Player.all) {
        if (Rebar.player.useStatus(player).hasCharacter()) {
            updatePlayerWeather(player);
        }
    }
}, 5000);
