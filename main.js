import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS_BASE } from "./fruits";
import "./style.css";

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  },
});

const world = engine.world;

const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const topLine = Bodies.rectangle(310, 150, 620, 2, {
  name: "topLine",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let disableAction = false;
let positionX = 300;
let interval = null;
let score = 0;
const scoreBoard = document.querySelector(".score");
scoreBoard.textContent = `score: ${score}`;

function addFruit() {
  const index = Math.floor(Math.random() * 5);
  const fruit = FRUITS_BASE[index];
  const body = Bodies.circle(positionX, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    render: {
      sprite: { texture: `${fruit.name}.png` },
    },
    // 탄성
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = fruit;

  World.add(world, body);
}

function mouseFunc(event) {
  Body.setPosition(currentBody, {
    x: event.clientX,
    y: currentBody.position.y,
  });
  positionX = event.clientX;
}

window.onmousedown = () => {
  window.addEventListener("mousemove", mouseFunc);
};

window.onmouseup = () => {
  window.removeEventListener("mousemove", mouseFunc);
  currentBody.isSleeping = false;
  disableAction = true;

  setTimeout(() => {
    addFruit();
    disableAction = false;
  }, 500);
};

const touchHandler = (e) => {
  Body.setPosition(currentBody, {
    x: e.changedTouches[0].clientX,
    y: currentBody.position.y,
  });
  positionX = e.changedTouches[0].clientX;
};

window.ontouchstart = () => {
  window.addEventListener("touchmove", touchHandler);
};

window.ontouchend = () => {
  window.removeEventListener("touchmove", touchHandler);
  currentBody.isSleeping = false;
  disableAction = true;

  setTimeout(() => {
    addFruit();
    disableAction = false;
  }, 500);
};

window.onkeydown = (e) => {
  if (disableAction) {
    return;
  }
  switch (e.code) {
    case "KeyA":
      if (interval) {
        return;
      }
      interval = setInterval(() => {
        if (currentBody.position.x - currentFruit.radius > 30) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
          positionX -= 1;
        }
      }, 5);
      break;
    case "KeyD":
      if (interval) {
        return;
      }
      interval = setInterval(() => {
        if (currentBody.position.x + currentFruit.radius < 590) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
          positionX += 1;
        }
      }, 5);
      break;
    case "KeyS":
      currentBody.isSleeping = false;
      disableAction = true;

      setTimeout(() => {
        addFruit();
        disableAction = false;
      }, 500);

      break;
  }
};

window.onkeyup = (e) => {
  switch (e.code) {
    case "KeyA":
    case "KeyD":
      clearInterval(interval);
      interval = null;
  }
};

Events.on(engine, "collisionStart", (e) => {
  e.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;
      // 수박이 충돌하면 그만
      if (index === FRUITS_BASE.length - 1) {
        return;
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);
      score += FRUITS_BASE[index].score;
      scoreBoard.textContent = `score: ${score}`;
      const newFruit = FRUITS_BASE[index + 1];

      const newBody = Bodies.circle(
        // 충돌한 지점의 좌표
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            sprite: { texture: `${newFruit.name}.png` },
          },
          index: index + 1,
        }
      );

      World.add(world, newBody);
    }

    if (
      !disableAction &&
      (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")
    ) {
      alert("Game over");
    }
  });
});

addFruit();
