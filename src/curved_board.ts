import {
    BoxGeometry,
    BufferGeometry,
    CylinderGeometry,
    Mesh,
    MeshPhysicalMaterial,
    PlaneGeometry,
    Vector3,
    Scene as ThreeScene,
    SpotLight,
    SpotLightHelper,
    Color
} from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

import { CurvePlane, InterpolateColorsCompact, RemapRange } from "./utils";
import { Config } from "./config";
import { GetAnalyser1024FrequencyData } from "./music_player";

const CURVED_BOARD_WORLD_POSITION = new Vector3(0, 60, -90);
const WALL_MATERIAL_OPTIONS = {
    color : 0xffffff,
    metalness : 0.5,
    roughness : 0.8
};
const AFFECTIVE_SHAPE_MATERIAL_OPTIONS = {
    color : 0xffffff,
    metalness : 1,
    roughness : 0.3
};

let AffectiveShapeGeometry : BufferGeometry;
let AffectiveShapes : Mesh[] = [];

let DancerLights : SpotLight[] = [];

function BuildAffectiveShapeGeometry() : BufferGeometry {
    const box = new BoxGeometry(30, 15, 2);
    const cylinder = new CylinderGeometry(4, 4, 20, 10, 1);

    box.translate(13, 0, -2.2);
    box.rotateY(-Math.PI / 4);

    const geomtry = BufferGeometryUtils.mergeGeometries([box, cylinder], false);

    geomtry.rotateX(Math.PI / 2);
    geomtry.rotateY(-Math.PI / 2);
    geomtry.scale(0.2, 0.2, 0.2);

    return geomtry;
}

function CreateCurvedAffectiveShapes(Scene : ThreeScene) : void {
    const position = new Vector3().copy(CURVED_BOARD_WORLD_POSITION);

    const board : any = {};
    board.geometry = new PlaneGeometry(220, 90, 21, 21);

    CurvePlane(board.geometry, 50, pos => {
        const material = new MeshPhysicalMaterial(AFFECTIVE_SHAPE_MATERIAL_OPTIONS);
        const shape = new Mesh(AffectiveShapeGeometry, material);

        shape.position.copy(pos.add(position).sub(new Vector3(0, 0, -5)));
        shape.scale.set(2, 2, 2);

        shape.castShadow = true;
        shape.receiveShadow = true;

        shape.lookAt(0, 0, 0);

        AffectiveShapes.push(shape);

        Scene.add(shape);
    });

    board.geometry.dispose();
    delete board.geometry;
}

function CreateLight(position : Vector3, target : Vector3, color : number, intensity : number, angle : number) : SpotLight {
    const light = new SpotLight(color, intensity);

    light.position.copy(position);
    light.target.position.copy(target);

    light.angle = angle;

    light.penumbra = 1;
    light.decay = 1;
    light.distance = 220;
    light.map = null;
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 1000;
    light.shadow.focus = 1;

    new SpotLightHelper(light);

    return light;
}

export function OnCurvedBoardRender(loadPower : number) : void {
    for (let light of DancerLights) {
        light.intensity = RemapRange(loadPower * 100, 0, 100, 1, 100);
        light.color = new Color(InterpolateColorsCompact(Config.dancer_light_color.from, Config.dancer_light_color.to, loadPower));
    }

    const data = GetAnalyser1024FrequencyData();

    for (let i = 0; i < AffectiveShapes.length; i++) {
        AffectiveShapes[i].lookAt(0, RemapRange(data[i], 0, 0xff, 50, 500), 0);
    }
}

export function InitCurvedBoard(Scene : ThreeScene) : void {
    AffectiveShapeGeometry = BuildAffectiveShapeGeometry();

    const wallGeometry = new PlaneGeometry(300, 140, 10, 10);
    const wallMaterial = new MeshPhysicalMaterial(WALL_MATERIAL_OPTIONS);
    const wall = new Mesh(wallGeometry, wallMaterial);

    CurvePlane(wallGeometry, 55);

    // wall.castShadow = true;
    // wall.receiveShadow = true;

    wall.position.copy(CURVED_BOARD_WORLD_POSITION);
    wall.position.add(new Vector3(0, 0, 10));

    Scene.add(wall);

    CreateCurvedAffectiveShapes(Scene);

    const mainLight = CreateLight(
        new Vector3(0, 135, -98.63092093733783),
        new Vector3(0.44200428244908, 10, -151.2419546860015),
        Config.main_light_color,
        100,
        Math.PI / 3
    );

    Scene.add(mainLight);

    DancerLights.push(CreateLight(
        new Vector3(71.6636132539122, 135, -77.66823752738148),
        new Vector3(124.92020194070969 , 10 , -123.10059147583168),
        Config.dancer_light_color.from,
        100,
        Math.PI / 7
    ));
    DancerLights.push(CreateLight(
        new Vector3(-68.3931392529584 , 135 , -79.82508568595989),
        new Vector3(-110.65155385955642 , 10 , -121.8696130079914),
        Config.dancer_light_color.from,
        100,
        Math.PI / 7
    ));

    for (let light of DancerLights) {
        Scene.add(light);
    }
}