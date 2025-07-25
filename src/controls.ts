import {
    Raycaster as ThreeRaycaster,
    Vector3,
    Scene,
    Camera,
    Mesh
} from "three";

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export type ObjectList = Mesh[];

const MOVE_FORWARD_KEY_CODE = "KeyW";
const MOVE_BACKWARD_KEY_CODE = "KeyS";
const MOVE_LEFT_KEY_CODE = "KeyA";
const MOVE_RIGHT_KEY_CODE = "KeyD";
const MOVE_JUMP_KEY_CODE = "Space";
const MOVE_SPRINT_KEY_CODE = "ShiftLeft";

const CONTROL_MOVE_SPEED = 500;
const CONTROL_MOVE_STOP_FACTOR = 10;
const CONTROL_MOVE_JUMP_POWER = 400;
const CONTROL_MOVE_SPRINT_FACRTOR = 2.5;
const CONTROL_GRAVITY = 9.8;

const CONTROLLER_HEIGHT = 10; // world units
const CONTROLLER_MASS = 100;  // KG

let Controls : PointerLockControls;

let HorizentalRaycaster : ThreeRaycaster;

const Objects : ObjectList = [];

let MoveForward = false;
let MoveBackward = false;
let MoveLeft = false;
let MoveRight = false;
let MoveSprint = false;
let CanJump = false;

let LastTick = performance.now();

const Velocity = new Vector3();
const Direction = new Vector3();

function OnKeyDown(event : KeyboardEvent) : void {
    switch (event.code) {
        case MOVE_FORWARD_KEY_CODE:
            MoveForward = true;
            break;
        case MOVE_BACKWARD_KEY_CODE:
            MoveBackward = true;
            break;
        case MOVE_LEFT_KEY_CODE:
            MoveLeft = true;
            break;
        case MOVE_RIGHT_KEY_CODE:
            MoveRight = true;
            break;
        case MOVE_SPRINT_KEY_CODE:
            MoveSprint = true;
            break;
        case MOVE_JUMP_KEY_CODE:
            if (CanJump) {
                Velocity.y += CONTROL_MOVE_JUMP_POWER;
            }

            CanJump = false;

            break;
    }
}

function OnKeyUp(event : KeyboardEvent) : void {
    switch (event.code) {
        case MOVE_FORWARD_KEY_CODE:
            MoveForward = false;
            break;
        case MOVE_BACKWARD_KEY_CODE:
            MoveBackward = false;
            break;
        case MOVE_LEFT_KEY_CODE:
            MoveLeft = false;
            break;
        case MOVE_RIGHT_KEY_CODE:
            MoveRight = false;
            break;
        case MOVE_SPRINT_KEY_CODE:
            MoveSprint = false;
            break;
    }
}

function OnRender() : void {
    const now = performance.now();

    if (Controls.isLocked) {
        let controlObject : Camera = Controls.getObject();  

        HorizentalRaycaster.ray.origin.copy(controlObject.position);
        HorizentalRaycaster.ray.origin.y -= CONTROLLER_HEIGHT;

        const intersection = HorizentalRaycaster.intersectObjects(Objects, false);

        const onObject = intersection.length > 0;

        const delta = (now - LastTick) / 1000;

        Velocity.x -= Velocity.x * CONTROL_MOVE_STOP_FACTOR * delta;
        Velocity.z -= Velocity.z * CONTROL_MOVE_STOP_FACTOR * delta;

        Velocity.y -= CONTROL_GRAVITY * CONTROLLER_MASS * delta;

        Direction.z = Number(MoveForward) - Number(MoveBackward);
        Direction.x = Number(MoveRight) - Number(MoveLeft);

        Direction.normalize();

        if (MoveForward || MoveBackward) {
            Velocity.z -= Direction.z * (CONTROL_MOVE_SPEED * (MoveSprint ? CONTROL_MOVE_SPRINT_FACRTOR : 1)) * delta;
        }

        if (MoveRight || MoveLeft) {
            Velocity.x -= Direction.x * (CONTROL_MOVE_SPEED * (MoveSprint ? CONTROL_MOVE_SPRINT_FACRTOR : 1)) * delta;
        }

        if (onObject) {
            Velocity.y = Math.max(0, Velocity.y);

            CanJump = true;
        }

        Controls.moveRight(-(Velocity.x * delta));
        Controls.moveForward(-(Velocity.z * delta));

        controlObject.position.y += Velocity.y * delta;

        if (controlObject.position.y < CONTROLLER_HEIGHT) {
            Velocity.y = 0;
            controlObject.position.y = CONTROLLER_HEIGHT;

            CanJump = true;
        }
    }

    LastTick = now;

    requestAnimationFrame(OnRender);
}

export default function ControlsInit(scene : Scene, camera : Camera, domElement : HTMLElement) : ObjectList {
    Controls = new PointerLockControls(camera, domElement);

    HorizentalRaycaster = new ThreeRaycaster(new Vector3(), new Vector3(0, -1, 0), 0, 10);

    domElement.addEventListener("click", () => {
        if (Controls.isLocked) {
            Controls.unlock();
            return;
        }

        Controls.lock();

        console.log("position is : ", camera.position.x, ",", camera.position.y, ",", camera.position.z);
    });

    window.addEventListener("keydown", OnKeyDown);
    window.addEventListener("keyup", OnKeyUp);

    scene.add(Controls.getObject());

    OnRender();

    return Objects;
}