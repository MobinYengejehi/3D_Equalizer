export interface SphereMaterialConfig {
    directory : string,
    color : string,
    ambient_occlusion : string,
    normal : string,
    displacement : string,
    emissiveMaskContrast : number,
    emissiveMaskColorPower : number,
    emissiveMaskColorPowerInterpolateFactor : number
};

export type MusicConfig = string[];

export interface Config_T {
    sphere_materials : SphereMaterialConfig[],
    music : MusicConfig,
    bloom_composer_enabled : boolean,
    special_color : number,
    main_light_color : number,
    dancer_light_color : {
        from : number,
        to : number
    }
};

export let Config : Config_T;

export function InitConfig() : void {
    const configJson = document.querySelector("#config")?.innerHTML;
    const config = JSON.parse(<string>configJson);

    const lights = config.lights;

    if (!lights || lights.length < 1)
    {
        console.error("Couldn't find any valid environment light settings!");
        return;
    }

    const selectedLight = lights[Math.min(lights.length - 1, Math.floor(Math.random() * lights.length))];

    Config = config;

    Config.special_color = Number(selectedLight.special_color);
    Config.main_light_color = Number(selectedLight.main_light_color);
    Config.dancer_light_color = {
        from : Number(selectedLight.dancer_light_color.from),
        to : Number(selectedLight.dancer_light_color.to)
    };
}