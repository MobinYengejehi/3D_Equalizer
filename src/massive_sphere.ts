import {
    Mesh,
    MeshPhongMaterial,
    MeshPhongMaterialParameters,
    TextureLoader as ThreeTextureLoader,
    Texture,
    IUniform,
    IcosahedronGeometry
} from "three";

export interface MassiveSphereParameters {
    geometry : {
        radius? : number,
        detail? : number
    },
    material? : MeshPhongMaterialParameters,
    textureLoaderPath? : string,
    mapTexturePath? : string,
    aoMapTexturePath? : string,
    normalTexturePath? : string,
    displacementTexturePath? : string
};

interface UniformMap {
    [key : string] : IUniform<any>
};

const TextureLoader = new ThreeTextureLoader().setPath("assets/");

export class MassiveSphere {
    public textureLoaderPath? = "";

    private params : MassiveSphereParameters;

    private geometryItem : IcosahedronGeometry | null;
    private materialItem : MeshPhongMaterial | null;
    private meshItem : Mesh | null;

    private uniforms : UniformMap = {
        emissiveMaskMap : { value : null },
        emissiveMaskContrast : { value : 0 },
        emissiveMaskColorPower : { value : 1 }
    };

    public get geometry() : IcosahedronGeometry {
        return this.geometryItem as IcosahedronGeometry;
    }

    public get material() : MeshPhongMaterial {
        return this.materialItem as MeshPhongMaterial;
    }

    public get mesh() : Mesh {
        return this.meshItem as Mesh;
    }

    public get emissiveMaskMap() : any {
        return this.uniforms.emissiveMaskMap.value;
    }

    public get emissiveMaskContrast() : number {
        return this.uniforms.emissiveMaskContrast.value;
    }

    public get emissiveMaskColorPower() : number {
        return this.uniforms.emissiveMaskColorPower.value;
    }

    public set emissiveMaskMap(value : any) {
        this.uniforms.emissiveMaskMap.value = value;
    }

    public set emissiveMaskContrast(value : number) {
        this.uniforms.emissiveMaskContrast.value = value;
    }

    public set emissiveMaskColorPower(value : number) {
        this.uniforms.emissiveMaskColorPower.value = value;
    }

    constructor(params : MassiveSphereParameters) {
        this.params = params;

        this.textureLoaderPath = params.textureLoaderPath;

        this.geometryItem = null;
        this.materialItem = null;
        this.meshItem = null;
    }

    public async Build() : Promise<void> {
        const params = this.params;

        this.geometryItem = new IcosahedronGeometry(params.geometry.radius, params.geometry.detail);
        this.materialItem = new MeshPhongMaterial(params.material);

        this.meshItem = new Mesh(this.geometryItem, this.materialItem);

        const uniforms = this.uniforms;

        this.material.onBeforeCompile = shader => {
            for (let uniformName in uniforms) {
                shader.uniforms[uniformName] = uniforms[uniformName];
            }

            shader.vertexShader = shader.vertexShader.replace(
                "#include <clipping_planes_pars_vertex>",
                /* glsl */`
                    #include <clipping_planes_pars_vertex>

                    varying vec2 emissiveMaskUv;
                `
            );

            shader.vertexShader = shader.vertexShader.replace(
                "#include <uv_vertex>",
                /* glsl */`
                    #include <uv_vertex>

                    emissiveMaskUv = uv;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <emissivemap_pars_fragment>",
                /* glsl */`
                    #include <emissivemap_pars_fragment>

                    uniform sampler2D emissiveMaskMap;
                    uniform float     emissiveMaskContrast;
                    uniform float     emissiveMaskColorPower;

                    varying vec2      emissiveMaskUv;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <emissivemap_fragment>",
                /* glsl */`
                    #include <emissivemap_fragment>

                    vec4 emissiveMaskColor = texture2D(emissiveMaskMap, emissiveMaskUv);

                    {
                        float contrast = emissiveMaskContrast;
                        vec3  color = emissiveMaskColor.rgb * emissiveMaskColorPower;

                        color = saturate(mix(vec3(0.5f, 0.5f, 0.5f), color, contrast));

                        totalEmissiveRadiance = mix(totalEmissiveRadiance, vec3(0.0f, 0.0f, 0.0f), color);
                    }
                `
            );
        };

        await this.ApplyTextures(params);
    }

    private async ApplyTextures(params : MassiveSphereParameters) : Promise<void> {
        if (!this.materialItem) {
            return;
        }

        const mapTexture = await this.loadTexture(params.mapTexturePath);
        const aoMapTexture = await this.loadTexture(params.aoMapTexturePath);
        const normalMapTexture = await this.loadTexture(params.normalTexturePath);
        const displacementMapTexture = await this.loadTexture(params.displacementTexturePath);

        this.materialItem.map = mapTexture;
        this.materialItem.aoMap = aoMapTexture;
        this.materialItem.normalMap = normalMapTexture;
        this.materialItem.displacementMap = displacementMapTexture;

        this.emissiveMaskMap = displacementMapTexture;
    }

    public async loadTexture(path? : string) : Promise<Texture | null> {
        if (!path || !this.textureLoaderPath) {
            return null;
        }

        TextureLoader.setPath(this.textureLoaderPath);

        return await TextureLoader.loadAsync(path);
    }
};