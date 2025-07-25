import { PlaneGeometry, Vector2, Vector3 } from "three";

export type CurvePlaneHandle = (pos : Vector3, i : number, total : number) => void;

export function RemapRange(value : number, inputMin : number, inputMax : number, outputMin : number, outputMax : number) : number {
    return (
        (
            (
                (value - inputMin) *
                (outputMax - outputMin)
            ) / (inputMax - inputMin)
        ) + outputMin
    );
}

export async function Sleep(duration : number) : Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(resolve, duration);
    });
}

export function CurvePlane(geometry : PlaneGeometry, blendDepth : number, posHandle? : CurvePlaneHandle) : void {
    const params = geometry.parameters;
    const halfWidth = params.width * 0.5;

    const a = new Vector2(-halfWidth, 0);
    const b = new Vector2(0, blendDepth);
    const c = new Vector2(halfWidth, 0);

    const ab = new Vector2().subVectors(a, b);
    const bc = new Vector2().subVectors(b, c);
    const ac = new Vector2().subVectors(a, c);

    const radius = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

    const center = new Vector2(0, blendDepth - radius);
    const base = new Vector2().subVectors(a, center);
    const baseAngle = base.angle() - (Math.PI * 0.5);
    const arc = baseAngle * 2;

    const uv = geometry.attributes.uv;
    const pos = geometry.attributes.position;
    const main = new Vector2();

    for (let i = 0; i < uv.count; i++) {
        const uvRatio = 1 - uv.getX(i);
        const y = pos.getY(i);

        main.copy(c).rotateAround(center, arc * uvRatio);
        pos.setXYZ(i, main.x, y, -main.y);

        if (posHandle) {
            posHandle(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)), i, uv.count);
        }
    }

    pos.needsUpdate = true;
}

export function InterpolateColorsCompact(a : number, b : number, progress : number) : number {
    let mask1 = 0xff00ff;
    let mask2 = 0x00ff00;

    let f2 = 256 * progress;
    let f1 = 256 - f2;

    return (
        (
            (
                (
                    ((a & mask1) * f1) + ((b & mask1) * f2)
                ) >> 8
            ) & mask1
        ) | (
            (
                (
                    ((a & mask2) * f1) + ((b & mask2) * f2)
                ) >> 8
            ) & mask2
        )
    );
}
