import {
  Engine,
  Render,
  Runner,
  Composites,
  Common,
  MouseConstraint,
  Mouse,
  Composite,
  Bodies,
  Events,
} from "matter-js";
import { FRUITS_BASE } from "./fruits";
import "./style.css";

const wallPad = 64;
const loseHeight = 84;
const statusBarHeight = 48;
const friction = {
  friction: 0.006,
  frictionStatic: 0.006,
  frictionAir: 0,
  restitution: 0.1,
};

const GameStates = {
  MENU: 0,
  READY: 1,
  DROP: 2,
  LOSE: 3,
};

const Game = {
  width: 640,
  height: 960,
  elements: {
    canvas: document.getElementById("game-canvas"),
    ui: document.getElementById("game-ui"),
    score: document.getElementById("game-score"),
    end: document.getElementById("game-end-container"),
    endTitle: document.getElementById("game-end-title"),
    statusValue: document.getElementById("game-highscore-value"),
    nextFruitImg: document.getElementById("game-next-fruit"),
    previewBall: null,
  },

  fruitsMerged: [],

  fruitSizes: [
    { radius: 24, scoreValue: 1, img: "./assets/img/circle0.png" },
    { radius: 32, scoreValue: 3, img: "./assets/img/circle1.png" },
    { radius: 40, scoreValue: 6, img: "./assets/img/circle2.png" },
    { radius: 56, scoreValue: 10, img: "./assets/img/circle3.png" },
    { radius: 64, scoreValue: 15, img: "./assets/img/circle4.png" },
    { radius: 72, scoreValue: 21, img: "./assets/img/circle5.png" },
    { radius: 84, scoreValue: 28, img: "./assets/img/circle6.png" },
    { radius: 96, scoreValue: 36, img: "./assets/img/circle7.png" },
    { radius: 128, scoreValue: 45, img: "./assets/img/circle8.png" },
    { radius: 160, scoreValue: 55, img: "./assets/img/circle9.png" },
    { radius: 192, scoreValue: 66, img: "./assets/img/circle10.png" },
  ],

  initGame: function () {
    Render.run(render);
    Runner.run(runner, engine);

    Composite.add(engine.world, menuStatics);

    // Game.loadHighscore();
    Game.elements.ui.style.display = "none";
    Game.fruitsMerged = Array.apply(null, Array(Game.fruitSizes.length)).map(
      () => 0
    );

    const menuMouseDown = () => {
      // 게임 시작 버튼이외에 클릭하면 리턴
      if (
        mouseConstraint.body === null ||
        mouseConstraint.body?.label !== "btn-start"
      ) {
        return;
      }

      // 게임 시작 버튼 클릭하면 스타트 게임 실행 및 이벤트 해제
      Events.off(mouseConstraint, "mousedown", menuMouseDown);
      Game.startGame();
    };

    Events.on(mouseConstraint, "mousedown", menuMouseDown);
  },
};

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
  element: Game.elements.canvas,
  engine,
  options: {
    width: Game.width,
    height: Game.height,
    wireframes: false,
    background: "#ffdcae",
  },
});

const menuStatics = [
  // Bodies.rectangle(Game.width / 2, Game.height * 0.4, 512, 512, {
  //   isStatic: true,
  //   render: { sprite: { texture: "./assets/img/bg-menu.png" } },
  // }),

  Bodies.rectangle(Game.width / 2, Game.height * 0.75, 512, 96, {
    isStatic: true,
    label: "btn-start",
    render: { sprite: { texture: "./assets/img/btn-start.png" } },
  }),
];

// ? 마우스 컨트롤 추가
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false,
    },
  },
});
render.mouse = mouse;

Game.initGame();
