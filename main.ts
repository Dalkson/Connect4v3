const width: number = document.body.clientWidth;
const height: number = document.body.clientHeight;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let currentTextState: string = "Not in Room";
let currentRoom: number = 0;

const rowGap = 70;
const colors = ["#FFFFFF", "#FF0000", "#FBFF00", "orange", "#04857F", "#359A2E", "magenta", "#0B0B6F"]

let playerNumber = 0;
let usernameList: string[] = [];

document.getElementById("rematchButton").style.display = "none";
document.getElementById("startButton").style.display = "none";

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
    currentTextState = "Room Full";
    return;
  }
  currentTextState = "room: " + String(room);
  currentRoom = room;
  playerNumber = player;
  board = createBoard(16, 10);
  lobbyUI();
});

socket.on("players", (userList: string[]) => {
  usernameList = userList;
})

socket.on("gamestart", (turn: number) => {
  gameStartUI();
  playerNumber == turn ? currentTextState = "Your Turn!" : currentTextState = "Player" + turn + "'s Turn";
})

socket.on("gameover", (player: number) => {
  document.getElementById("rematchButton").style.display = "";
  console.log("game is over " + player);

  setTimeout(() => {  switch (player) {
    case -1:
      currentTextState = "Stalemate!";
      break;
    case playerNumber:
      currentTextState = "You Win!";
      break;
    default:
      currentTextState = "You Lose!";
      break;
  }}, 100);

})



socket.on("rematch", (turn: number) => {
  document.getElementById("rematchButton").style.display = "none";
  playerNumber == turn ? currentTextState = "Your Turn" : currentTextState = "Player" + turn + "'s Turn";
  board = createBoard(16, 10);
})

socket.on("droppedDisk", (player: number, column: number, turn: number) => {
  if (playerNumber == turn) {currentTextState = "Your Turn!";} else {
    currentTextState = "Player" + turn + "'s Turn";}
  dropDisk(player, column);
})


const joinButton = document.getElementById("joinButton");
joinButton.addEventListener("click", () => {
  const roomCode = Number((<HTMLInputElement>document.getElementById("joinID")).value);
  const username = String((<HTMLInputElement>document.getElementById("username")).value);
  if (username == "") {
    currentTextState = "Enter Name";
  } else{socket.emit("join", roomCode, username);}
});

const hostButton = document.getElementById("hostButton");
hostButton.addEventListener("click", () => {
  const username = String((<HTMLInputElement>document.getElementById("username")).value);
  if (username == "") {
    currentTextState = "Enter Name";
  } else{
    socket.emit("host", (username));
    document.getElementById("startButton").style.display = "";}
});

const rematchButton = document.getElementById("rematchButton");
rematchButton.addEventListener("click", () => {
  socket.emit("rematch", (currentRoom));
});

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", () => {
  socket.emit("startGame", (currentRoom));
});

let board: number[][] = createBoard(16, 10);


function printMousePos(event: MouseEvent): void {
  if (event.clientY >= 90 && event.clientX >= 160) {
    let column = 0
    for (let c = 0; c < board.length; c++) {
      if (event.clientX >= (rowGap * (c + 1) + 1) + 95 && event.clientX <= (rowGap * 2) * (c + 1) + 95) {
        column = c;
      }
    }
    socket.emit("dropDisk", column, currentRoom);
  }
}

document.addEventListener("click", printMousePos);

function main(): void {
  function draw_frame(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawText(currentTextState);
    drawPlayers(usernameList);

    window.requestAnimationFrame(draw_frame);
  }
  window.requestAnimationFrame(draw_frame);
}

function drawText(text: string): void {
  ctx.fillStyle = "black";
  ctx.fillRect(10, 10, 320, 75);
  ctx.fillStyle = "red";
  ctx.font = "40px Verdana";
  ctx.fillText(text, 20, 60);
}

function drawPlayer(username: string, i: number): void {
  ctx.fillStyle = colors[i+1];
  ctx.fillRect(10, 95 + (i * 70), 150, 60);
  ctx.fillStyle = "black";
  ctx.font = "30px Verdana";
  ctx.fillText(username, 20, 135 + (i * 70));
  
}

function drawPlayers(usernameList: string[]) {
  for (let i = 0; i < usernameList.length; i++) {
    drawPlayer(usernameList[i], i);
  }
}

function drawBoard(): void {
  ctx.fillStyle = "#0B0B6F";
  ctx.fillRect(0, 0, width, height);
  let x = 200;
  board.forEach(column => {
    let y = 125;
    column.forEach(cell => {
      drawCircle(x, y, 30, colors[cell]);
      y += rowGap;
    });
    x += rowGap;
  });
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

function gameStartUI() {
  document.getElementById("joinButton").style.display = "none";
  document.getElementById("hostButton").style.display = "none";
  document.getElementById("joinID").style.display = "none";
  document.getElementById("username").style.display = "none";
  document.getElementById("rematchButton").style.display = "none";
  document.getElementById("startButton").style.display = "none";
}

function lobbyUI() {
  document.getElementById("joinButton").style.display = "none";
  document.getElementById("hostButton").style.display = "none";
  document.getElementById("joinID").style.display = "none";
  document.getElementById("username").style.display = "none";
  document.getElementById("rematchButton").style.display = "none";
}

function createBoard(x: number, y: number): number[][] {
  const board: number[][] = [];
  for (let j = 0; j < x; j++) {
    board.push([]);
    for (let k = 0; k < y; k++) {
      board[j][k] = 0;
    }
  }
  return board;
}



main();
