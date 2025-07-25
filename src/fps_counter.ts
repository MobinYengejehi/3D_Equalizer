import Stats from "three/addons/libs/stats.module.js";

const Status = new Stats();

function OnRender() {
    Status.update()

    requestAnimationFrame(OnRender);
}

export default function FpsCounterInit(parent : HTMLDivElement) : void {
    // parent.appendChild(Status.dom);

    OnRender();
}