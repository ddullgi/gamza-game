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

// 물체 마찰값 설정
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
  cache: { highscore: 0 },
  sounds: {
    click: new Audio("./assets/click.mp3"),
    pop0: new Audio("./assets/pop0.mp3"),
    pop1: new Audio("./assets/pop1.mp3"),
    pop2: new Audio("./assets/pop2.mp3"),
    pop3: new Audio("./assets/pop3.mp3"),
    pop4: new Audio("./assets/pop4.mp3"),
    pop5: new Audio("./assets/pop5.mp3"),
    pop6: new Audio("./assets/pop6.mp3"),
    pop7: new Audio("./assets/pop7.mp3"),
    pop8: new Audio("./assets/pop8.mp3"),
    pop9: new Audio("./assets/pop9.mp3"),
    pop10: new Audio("./assets/pop10.mp3"),
  },

  stateIndex: GameStates.MENU,

  score: 0,
  fruitsMerged: [],

  // 점수 계산 함수
  calculateScore: () => {
    const score = Game.fruitsMerged.reduce((total, count, sizeIndex) => {
      const value = Game.fruitSizes[sizeIndex].scoreValue * count;
      return total + value;
    }, 0);

    Game.score = score;
    Game.elements.score.innerText = Game.score;
  },

  fruitSizes: [
    { radius: 24, scoreValue: 1, img: "./assets/img/circle0.png", scale: 160 },
    { radius: 32, scoreValue: 3, img: "./assets/img/circle1.png", scale: 242 },
    { radius: 40, scoreValue: 6, img: "./assets/img/circle2.png", scale: 99 },
    { radius: 56, scoreValue: 10, img: "./assets/img/circle3.png", scale: 512 },
    { radius: 64, scoreValue: 15, img: "./assets/img/circle4.png", scale: 245 },
    { radius: 72, scoreValue: 21, img: "./assets/img/circle5.png", scale: 462 },
    { radius: 84, scoreValue: 28, img: "./assets/img/circle6.png", scale: 512 },
    { radius: 96, scoreValue: 36, img: "./assets/img/circle7.png", scale: 512 },
    {
      radius: 128,
      scoreValue: 45,
      img: "./assets/img/circle8.png",
      scale: 512,
    },
    {
      radius: 160,
      scoreValue: 55,
      img: "./assets/img/circle9.png",
      scale: 512,
    },
    {
      radius: 192,
      scoreValue: 66,
      img: "./assets/img/circle10.png",
      size: 512,
    },
  ],

  currentFruitSize: 0,
  nextFruitSize: 0,
  setNextFruitSize: function () {
    Game.nextFruitSize = Math.floor(Math.random() * 5);
    Game.elements.nextFruitImg.src = `./assets/img/circle${Game.nextFruitSize}.png`;
  },

  initGame: () => {
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

  startGame: () => {
    Game.sounds.click.play();

    // 메뉴 버튼 삭제
    Composite.remove(engine.world, menuStatics);

    // 벽 추가
    Composite.add(engine.world, gameStatics);

    // 멈춰있는 첫번째 과일 생성
    Game.elements.previewBall = Game.generateFruitBody(Game.width / 2, 0, 0, {
      isStatic: true,
    });
    Composite.add(engine.world, Game.elements.previewBall);

    setTimeout(() => {
      Game.stateIndex = GameStates.READY;
    }, 250);

    // 과일 이동 이벤트
    Events.on(mouseConstraint, "mousemove", (e) => {
      if (Game.stateIndex !== GameStates.READY) return;
      if (Game.elements.previewBall === null) return;

      Game.elements.previewBall.position.x = e.mouse.position.x;
    });

    Events.on(mouseConstraint, "mouseup", function (e) {
      Game.addFruit(e.mouse.position.x);
    });

    Events.on(engine, "collisionStart", (e) => {
      e.pairs.forEach((collision) => {
        const bodyA = collision.bodyA;
        const bodyB = collision.bodyB;

        // 벽이랑 충돌할 경우
        if (bodyA.isStatic || bodyB.isStatic) return;

        const aY = bodyA.position.y + bodyA.circleRadius;
        const bY = bodyB.position.y + bodyB.circleRadius;

        // 패배 조건
        if (aY < loseHeight || bY < loseHeight) {
          Game.loseGame();
          return;
        }

        // 크기가 다를경우 건너 뜀
        if (bodyA.sizeIndex !== bodyB.sizeIndex) return;

        let newSize = bodyA.sizeIndex + 1;

        // 수박 두개 합쳐지는 경우
        if (
          bodyA.circleRadius >=
          Game.fruitSizes[Game.fruitSizes.length - 1].radius
        ) {
          Game.fruitsMerged[bodyA.sizeIndex] += 1;
          Game.sounds[`pop${bodyA.sizeIndex}`].play();
          Composite.remove(engine.world, [bodyA, bodyB]);
          Game.addPop(midPosX, midPosY, bodyA.circleRadius);
          return;
        }

        Game.fruitsMerged[bodyA.sizeIndex] += 1;

        // Therefore, circles are same size, so merge them.
        const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
        const midPosY = (bodyA.position.y + bodyB.position.y) / 2;

        Game.sounds[`pop${bodyA.sizeIndex}`].play();
        Composite.remove(engine.world, [bodyA, bodyB]);
        Composite.add(
          engine.world,
          Game.generateFruitBody(midPosX, midPosY, newSize)
        );
        Game.addPop(midPosX, midPosY, bodyA.circleRadius);
        Game.calculateScore();
      });
    });
  },

  // 과일 몸체 생성
  generateFruitBody: function (x, y, sizeIndex, extraConfig = {}) {
    const size = Game.fruitSizes[sizeIndex];
    const circle = Bodies.circle(x, y, size.radius, {
      ...friction,
      ...extraConfig,
      render: {
        sprite: {
          texture: size.img,
          xScale: size.radius / size.scale,
          yScale: size.radius / size.scale,
        },
      },
    });
    circle.sizeIndex = sizeIndex;

    return circle;
  },

  addFruit: (x) => {
    if (Game.stateIndex !== GameStates.READY) return;

    Game.sounds.click.play();

    Game.stateIndex = GameStates.DROP;
    const latestFruit = Game.generateFruitBody(x, 0, Game.currentFruitSize);
    Composite.add(engine.world, latestFruit);

    Game.currentFruitSize = Game.nextFruitSize;
    Game.setNextFruitSize();
    Game.calculateScore();

    Composite.remove(engine.world, Game.elements.previewBall);
    Game.elements.previewBall = Game.generateFruitBody(
      render.mouse.position.x,
      0,
      Game.currentFruitSize,
      {
        isStatic: true,
        collisionFilter: { mask: 0x0040 },
      }
    );

    setTimeout(() => {
      if (Game.stateIndex === GameStates.DROP) {
        Composite.add(engine.world, Game.elements.previewBall);
        Game.stateIndex = GameStates.READY;
      }
    }, 500);
  },

  addPop: (x, y, r) => {
    const circle = Bodies.circle(x, y, r, {
      isStatic: true,
      collisionFilter: { mask: 0x0040 },
      angle: rand() * (Math.PI * 2),
      render: {
        sprite: {
          texture: "./assets/img/pop.png",
          xScale: r / 384,
          yScale: r / 384,
        },
      },
    });

    Composite.add(engine.world, circle);
    setTimeout(() => {
      Composite.remove(engine.world, circle);
    }, 100);
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

const wallProps = {
  isStatic: true,
  render: { fillStyle: "#FFEEDB" },
  ...friction,
};

const gameStatics = [
  // Left
  Bodies.rectangle(
    -(wallPad / 2),
    Game.height / 2,
    wallPad,
    Game.height,
    wallProps
  ),

  // Right
  Bodies.rectangle(
    Game.width + wallPad / 2,
    Game.height / 2,
    wallPad,
    Game.height,
    wallProps
  ),

  // Bottom
  Bodies.rectangle(
    Game.width / 2,
    Game.height + wallPad / 2 - statusBarHeight,
    Game.width,
    wallPad,
    wallProps
  ),
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
