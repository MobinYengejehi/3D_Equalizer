import {
    PerspectiveCamera,
    Scene as ThreeScene,
    WebGLRenderer,
    Color,
    Mesh,
    Fog,
    HemisphereLight,
    SpotLight,
    PCFSoftShadowMap,
    ACESFilmicToneMapping,
    Vector2,
    ShaderMaterial,
    DoubleSide,
    Layers,
    MeshBasicMaterial,
    Material,
    SRGBColorSpace,
    Object3D,
    PlaneGeometry,
    MeshLambertMaterial
} from "three";
import {
    UnrealBloomPass,
    ShaderPass,
    OutputPass,
    RenderPass,
    EffectComposer
} from "three/examples/jsm/Addons.js";

import ControlsInit, { ObjectList } from "./controls";
import { MassiveSphere } from "./massive_sphere";
import { RemapRange } from "./utils";
import { Config, SphereMaterialConfig } from "./config";
import {
    InitMusicPlayer,
    GetPlayerLoadness,
    GetMinimumSampleRange,
    GetMaximumSampleRange
} from "./music_player";
import { InitCurvedBoard, OnCurvedBoardRender } from "./curved_board";

const BLOOM_SCENE = 1;

const Camera = new PerspectiveCamera(38, window.innerWidth / window.innerHeight, 1, 1000);
const Scene = new ThreeScene();
const Renderer = new WebGLRenderer({ antialias : true });

const RenderScene = new RenderPass(Scene, Camera);
const BloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);

const BloomComposer = new EffectComposer(Renderer);
const FinalComposer = new EffectComposer(Renderer);

const BloomLayer = new Layers();

const DarkMaterial = new MeshBasicMaterial({ color : 0x000000 });
const Materials : { [key : string] : Material | Material[] } = {};

let VisualizerSphere : MassiveSphere;
let SPLight : SpotLight;

export let SelectedSphereMaterial : SphereMaterialConfig;

export async function OnInit() : Promise<void> {
    Camera.position.set(0, 1, 0);
    Camera.lookAt(0, 1, 0);
    Camera.layers.enable(0);
    Camera.layers.enable(1);

    Camera.position.set(8.050869121172505, 50.03205560041558, 110.87623656286746);
    Camera.rotateY(Math.PI / 100);

    Scene.background = new Color(0x000000);
    Scene.fog = new Fog(0x000000, 0, 750);

    Renderer.setPixelRatio(window.devicePixelRatio);
    Renderer.setSize(window.innerWidth, window.innerHeight);

    Renderer.shadowMap.enabled = true;
    Renderer.shadowMap.type = PCFSoftShadowMap;
    Renderer.toneMapping = ACESFilmicToneMapping;
    Renderer.toneMappingExposure = 1;
    Renderer.outputColorSpace = SRGBColorSpace;

    BloomPass.threshold = 0.1;
    BloomPass.strength = 1;
    BloomPass.radius = 0.5;

    BloomComposer.setSize(window.innerWidth, window.innerHeight);
    BloomComposer.addPass(RenderScene);
    BloomComposer.addPass(BloomPass);

    BloomComposer.renderToScreen = false;

    const mixPass = new ShaderPass(
        new ShaderMaterial({
            uniforms : {
                baseTexture : { value : null },
                bloomTexture : { value : BloomComposer.renderTarget2.texture }
            },
            vertexShader : /* glsl */`
                varying vec2 vUv;

                void main() {
                    vUv = uv;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
                }
            `,
            fragmentShader : /* glsl */`
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;

                varying vec2 vUv;

                void main() {
                    gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0f) * texture2D(bloomTexture, vUv);
                }
            `
        }),
        "baseTexture"
    );

    FinalComposer.setSize(window.innerWidth, window.innerHeight);
    FinalComposer.addPass(RenderScene);
    FinalComposer.addPass(mixPass);
    FinalComposer.addPass(new OutputPass());

    BloomLayer.set(BLOOM_SCENE);

    const ambient = new HemisphereLight(0x000000, 0xffffff, 0.15);
    Scene.add(ambient);
    
    const spotLight = new SpotLight(Config.main_light_color, 100);

    spotLight.intensity = 20;
    
    spotLight.position.set(0, 60, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 1;
    spotLight.decay = 1;
    spotLight.distance = 300;
    spotLight.map = null;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.focus = 1;

    Scene.add(spotLight);

    SPLight = spotLight;
    
    const planeGeometry = new PlaneGeometry(500, 500, 1, 1);
    const planeMaterial = new MeshLambertMaterial({ color : 0xffffff });
    const plane = new Mesh(planeGeometry, planeMaterial);

    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;

    Scene.add(plane);

    SelectedSphereMaterial = Config.sphere_materials[Math.min(Config.sphere_materials.length - 1, Math.floor(Math.random() * Config.sphere_materials.length))];

    const sphere = new MassiveSphere({
        geometry : {
            radius : 7,
            detail : 15
        },
        material : { side : DoubleSide },
        textureLoaderPath : "assets/SphereMaterial/" + SelectedSphereMaterial.directory,
        mapTexturePath : SelectedSphereMaterial.color,
        aoMapTexturePath : SelectedSphereMaterial.ambient_occlusion,
        normalTexturePath : SelectedSphereMaterial.normal,
        displacementTexturePath : SelectedSphereMaterial.displacement
    });

    await sphere.Build();
    
    VisualizerSphere = sphere;

    sphere.material.specular = new Color(0xa45215);
    sphere.material.shininess = 100;

    sphere.mesh.castShadow = true;
    sphere.mesh.receiveShadow = true;
    
    sphere.mesh.position.y = 50;
    sphere.mesh.position.x += 4;
    
    sphere.material.emissive = new Color(Config.special_color);
    sphere.material.emissiveIntensity = 0;

    sphere.mesh.layers.toggle(BLOOM_SCENE);

    Scene.add(sphere.mesh);

    InitMusicPlayer(Camera);

    InitCurvedBoard(Scene);

    {
        const objects : ObjectList = ControlsInit(Scene, Camera, <HTMLElement>Renderer.domElement);

        objects.push(sphere.mesh);
    }
}

async function TestMaterial() : Promise<void> {

}

export function OnResize() : void {
    const { innerWidth : width, innerHeight : height } = window;

    Camera.aspect = width / height;
    Camera.updateProjectionMatrix();

    Renderer.setSize(width, height);

    BloomComposer.setSize(width, height);
    FinalComposer.setSize(width, height);
}

function NonBloomed(object : Object3D) : void {
    const obj = <Mesh>object;

    if (obj.isMesh && BloomLayer.test(obj.layers) === false) {
        Materials[obj.uuid] = obj.material;
        obj.material = DarkMaterial;
    }
}

function RestoreMaterial(object : Object3D) : void {
    const obj = <Mesh>object;

    if (Materials[obj.uuid]) {
        obj.material = Materials[obj.uuid];
        delete Materials[obj.uuid];
    }
}

export function OnRender() : void {
    requestAnimationFrame(OnRender);

    if (!VisualizerSphere) {
        return;
    }

    const time = performance.now() / 3000;

    SPLight.position.x = Math.cos(time) * 50;
    SPLight.position.z = Math.sin(time) * 50;

    const loadRangeMin = 0;
    const loadRangeMax = 20;

    const load = RemapRange(GetPlayerLoadness(), GetMinimumSampleRange(), GetMaximumSampleRange(), loadRangeMin, loadRangeMax);
    const loadPower = RemapRange(load, loadRangeMin, loadRangeMax, 0, 1);

    VisualizerSphere.material.displacementScale = Math.max(1, load);
    VisualizerSphere.material.emissiveIntensity = loadPower;

    VisualizerSphere.emissiveMaskContrast = SelectedSphereMaterial.emissiveMaskContrast;
    VisualizerSphere.emissiveMaskColorPower = (
        SelectedSphereMaterial.emissiveMaskColorPower -
        Math.max(1, RemapRange(load, loadRangeMin, loadRangeMax, 0, SelectedSphereMaterial.emissiveMaskColorPower - 1)) *
        SelectedSphereMaterial.emissiveMaskColorPowerInterpolateFactor
    );

    VisualizerSphere.mesh.rotation.x = Math.cos(time) * Math.PI;
    VisualizerSphere.mesh.rotation.z = Math.sin(time) * Math.PI;
    VisualizerSphere.mesh.rotation.y = Math.sin(time) * Math.cos(time) * Math.PI;

    OnCurvedBoardRender(loadPower);

    if (Config.bloom_composer_enabled)
    {
        Scene.traverse(NonBloomed);
        BloomComposer.render();
        Scene.traverse(RestoreMaterial);
    }
    
    FinalComposer.render();
}

export default Renderer.domElement;