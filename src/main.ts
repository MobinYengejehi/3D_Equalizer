
/*
This project is simulating some Unreal Engine project in Three.js
Unreal project YouTube video : https://www.youtube.com/watch?v=LOC11v8AO5s
*/

import "./style.css";

import Canvas, { OnInit, OnResize, OnRender } from "./app";
import FpsCounterInit from "./fps_counter";
import { InitConfig } from "./config";

function Main() : void {
  const App = document.querySelector<HTMLDivElement>("#app");

  window.addEventListener("resize", OnResize);

  InitConfig();

  OnInit();

  OnRender();

  App?.appendChild(Canvas);
  FpsCounterInit(App as HTMLDivElement);
}

Main();