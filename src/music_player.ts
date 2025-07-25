import {
    Audio,
    AudioAnalyser,
    AudioContext as ThreeAudioContext,
    AudioListener,
    AudioLoader,
    Camera
} from "three";

import { Config } from "./config";
import { Sleep } from "./utils";

const WorldAudioContext = new AudioContext();

const Listener = new AudioListener();
const Loader = new AudioLoader();

export const PlayerSound = new Audio(Listener);

const Analyser128 = new AudioAnalyser(PlayerSound, 128);
const Analyser512 = new AudioAnalyser(PlayerSound, 512);
const Analyser1024 = new AudioAnalyser(PlayerSound, 1024);
const Analyser2048 = new AudioAnalyser(PlayerSound, 2048);

let SelectedMusic = 0;

export function GetPlayerLoadness() : number {
    let load = 0;

    load += Analyser128.getAverageFrequency();
    load += Analyser512.getAverageFrequency();
    load += Analyser1024.getAverageFrequency();
    load += Analyser2048.getAverageFrequency();

    return load;
}

export function GetAnalyserCount() : number {
    return 4;
}

export function GetMaximumSampleRange() : number {
    return GetAnalyserCount() * 0xff;
}

export function GetMinimumSampleRange() : number {
    return 0;
}

export function GetAnalyser128FrequencyData() : Uint8Array {
    return Analyser128.getFrequencyData();
}

export function GetAnalyser512FrequencyData() : Uint8Array {
    return Analyser512.getFrequencyData();
}

export function GetAnalyser1024FrequencyData() : Uint8Array {
    return Analyser1024.getFrequencyData();
}

export function GetAnalyser2048FrequencyData() : Uint8Array {
    return Analyser2048.getFrequencyData();
}

async function LoadPlayerSound() : Promise<void> {
    const path = Config.music[SelectedMusic];

    const buffer = await Loader.loadAsync(path);

    PlayerSound.setBuffer(buffer);
}

async function SetPlayerPaused(state : boolean) : Promise<void> {
    console.log("trying to pause : ", state);

    if (state) {
        PlayerSound.pause();
        return;
    }

    await WorldAudioContext.resume();

    PlayerSound.play();
}

async function SkipPlayerNext() : Promise<void> {
    console.log("skiping to next: ", SelectedMusic);
    if (SelectedMusic >= Config.music.length - 1) {
        SelectedMusic = 0;
    }else{
        SelectedMusic++;
    }

    PlayerSound.stop();

    await LoadPlayerSound();

    SetPlayerPaused(false);
}

async function SkipPlayerPrevious() : Promise<void> {
    console.log("skiping to previous: ", SelectedMusic);

    if (SelectedMusic <= 0) {
        SelectedMusic = Config.music.length - 1;
    }else{
        SelectedMusic--;
    }

    PlayerSound.stop();

    await LoadPlayerSound();

    SetPlayerPaused(false);
}

export async function InitMusicPlayer(camera : Camera) : Promise<void> {
    ThreeAudioContext.setContext(WorldAudioContext);

    Listener.context = WorldAudioContext;

    camera.add(Listener);

    Loader.setPath("assets/music/");

    SelectedMusic = Math.min(Config.music.length - 1, Math.floor(Math.random() * Config.music.length));

    await LoadPlayerSound();

    PlayerSound.setLoop(false);
    PlayerSound.setVolume(1);
    PlayerSound.onEnded = SkipPlayerNext;

    await Sleep(1000);

    await SetPlayerPaused(false);

    window.addEventListener("keypress", event => {
        switch (event.code)
        {
            case "KeyO":
                SetPlayerPaused(PlayerSound.isPlaying);
                break;
            case "KeyP":
                SkipPlayerNext();
                break;
            case "KeyI":
                SkipPlayerPrevious();
                break;
            default:
                break;
        }
    });
}