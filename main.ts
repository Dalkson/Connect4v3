const height: number = 780;
const width: number = 900;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let currentTextState: string = "Not in Room";
let currentRoom: number = 0;

let playerNumber = 0;

import { defaultMaxListeners } from "events";
import { io } from "socket.io-client";

const socket = io("http://75.136.67.139:1234");

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

socket.on("connect", () => {
  //console.log("connected", socket.id);
});

socket.on("joined", (room: number, player: number) => {
  if (room == -1) {
    currentTextState = "Doesn't Exist";
    return;
  }
  if (room == -2) {
    currentTextState = "Room Full"
    return;
  }
  currentTextState = "room: " + String(room);
  currentRoom = room;
  playerNumber = player;
  clearBoard();
});

socket.on("gamestart", () => {
  playerNumber == 1 ? currentTextState = "Your Turn" : currentTextState = "Waiting";
})

socket.on("gameover", (player: number) => {
  switch (player) {
    case -1:
      currentTextState = "Stalemate!";
      break;
    case playerNumber:
      currentTextState = "You Win!";
      break;
    default:
      currentTextState = "You Lose!";
      break;
  }
})

socket.on("rematch", (turn: number) => {
  clearBoard();
  playerNumber == turn ? currentTextState = "Your Turn" : currentTextState = "Waiting";
})

socket.on("droppedDisk", (player: number, column: number) => {
  dropDisk(player, column);
  switch (playerNumber) {
    case 1:
      if (player == 3) {
        currentTextState = "Your Turn";
      } else {currentTextState = "Waiting";}
      break;
    case 2:
      if (player == 1) {
        currentTextState = "Your Turn";
      } else {currentTextState = "Waiting";}
      break;
    case 3:
      if (player == 2) {
        currentTextState = "Your Turn";
      } else {currentTextState = "Waiting";}
      break;
  }
})

let joinButton = document.getElementById("joinButton");
joinButton.addEventListener("click", (e:Event) => {
  var inputValue = Number((<HTMLInputElement>document.getElementById("joinID")).value);
  socket.emit("join", inputValue);
});

let hostButton = document.getElementById("hostButton");
hostButton.addEventListener("click", (e:Event) => {
  socket.emit("host");
});

let rematchButton = document.getElementById("rematchButton");
rematchButton.addEventListener("click", (e:Event) => {
  socket.emit("rematch", (currentRoom));
});

let board: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const mousePosText = document.getElementById('mouse-pos');
let mousePos = {x: 1, y: 1};

window.addEventListener('mousemove', (event) => {
  mousePos = { x: event.clientX, y: event.clientY };
  mousePosText.textContent = `(${mousePos.x}, ${mousePos.y})`;
});

function printMousePos(event: MouseEvent): void {
  if (event.clientY >= 100 && event.clientY <= 780 && event.clientX <= 850 && event.clientX >= 60) {
    let column = 0
    if (event.clientX >= 70 && event.clientX <= 140) {
      column = 0;
    }
    if (event.clientX >= 141 && event.clientX <= 210) {
      column = 1;
    }
    if (event.clientX >= 211 && event.clientX <= 280) {
      column = 2;
    }
    if (event.clientX >= 281 && event.clientX <= 350) {
      column = 3;
    }
    if (event.clientX >= 351 && event.clientX <= 420) {
      column = 4;
    }
    if (event.clientX >= 421 && event.clientX <= 490) {
      column = 5;
    }
    if (event.clientX >= 491 && event.clientX <= 560) {
      column = 6;
    }
    if (event.clientX >= 561 && event.clientX <= 630) {
      column = 7;
    }
    if (event.clientX >= 631 && event.clientX <= 700) {
      column = 8;
    }
    if (event.clientX >= 701 && event.clientX <= 770) {
      column = 9;
    }
    if (event.clientX >= 771 && event.clientX <= 840) {
      column = 10;
    }
    if (isFull(board[column])) {
      return;
    }
    socket.emit("dropDisk", column, currentRoom)
  }  
}
  
  document.addEventListener("click", printMousePos);

function main(): void {
  function draw_frame(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawText(currentTextState);

    window.requestAnimationFrame(draw_frame);
  }
  window.requestAnimationFrame(draw_frame);
}

function drawText(text: string): void {
  ctx.fillStyle = "black"
  ctx.fillRect(230, 20, 290, 75)
  ctx.fillStyle = "red"
  ctx.font = `40px Verdana`;
  ctx.fillText(text, 250, 70);
}

function drawBoard(): void {
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, 1100, 780);
  let x = 100;
  board.forEach(column => {
    let y = 175;
    column.forEach(cell => {
      switch(cell) {
        case 1:
          drawCircle(x, y, 30, "red");
          break;
        case 2:
          drawCircle(x, y, 30, "yellow");
          break;
        case 3:
          drawCircle(x, y, 30, "green");
          break;
        default:
          drawCircle(x, y, 30, "white");
          break;
      }
      y += 70;
    });
    x += 70;
  });
}

function isFull(column: number[]): boolean {
  if (column[0] == 0) {return false;} else {return true;}
}

function dropDisk(player: number, column: number): void {
  for (let index = board[column].length - 1; index >= 0; index--) {
    const cell = board[column][index];
    if(cell == 0) {
      board[column][index] = player;
      return;
    }
  }
}

function drawCircle(x: number, y: number, raduis: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, raduis, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function clearBoard() {
  board = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
}

main()
