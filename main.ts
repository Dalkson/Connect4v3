const height: number = 780;
const width: number = 1000;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let currentTextState: string = "Not in Room";
let currentRoom: number = 0;

const rowGap = 70;
const colors = ["#FFFFFF", "#FF0000", "#FBFF00", "orange", "#04857F", "#359A2E", "magenta"]

let playerNumber = 0;
let usernameList: string[] = [];

document.getElementById("rematchButton").style.display = 'none';
document.getElementById("startButton").style.display = 'none';

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
  lobbyUI()
});

socket.on("players", (userList: string[]) => {
  usernameList = userList;
})

socket.on("gamestart", (turn: number) => {
  gameStartUI()
  playerNumber == turn ? currentTextState = "Your Turn" : currentTextState = "Player" + turn + "'s Turn";
})

socket.on("gameover", (player: number) => {
  document.getElementById("rematchButton").style.display = '';
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
  document.getElementById("rematchButton").style.display = 'none';
  playerNumber == turn ? currentTextState = "Your Turn" : currentTextState = "Player" + turn + "'s Turn";
  clearBoard();
})

socket.on("droppedDisk", (player: number, column: number, turn: number) => {
  if (playerNumber == turn) {currentTextState = "Your Turn!";} else {
    currentTextState = "Player" + turn + "'s Turn";}
  dropDisk(player, column);
})


let joinButton = document.getElementById("joinButton");
joinButton.addEventListener("click", (e:Event) => {
  var roomCode = Number((<HTMLInputElement>document.getElementById("joinID")).value);
  var username = String((<HTMLInputElement>document.getElementById("username")).value);
  if (username == '') {
    currentTextState = "Enter Name"
  } else{socket.emit("join", roomCode, username);}
});

let hostButton = document.getElementById("hostButton");
hostButton.addEventListener("click", (e:Event) => {
  var username = String((<HTMLInputElement>document.getElementById("username")).value);
  if (username == '') {
    currentTextState = "Enter Name"
  } else{
    socket.emit("host", (username));
    document.getElementById("startButton").style.display = '';}
});

let rematchButton = document.getElementById("rematchButton");
rematchButton.addEventListener("click", (e:Event) => {
  socket.emit("rematch", (currentRoom));
});

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", (e:Event) => {
  socket.emit("startGame", (currentRoom));
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



function printMousePos(event: MouseEvent): void {
  if (event.clientY >= 100 && event.clientY <= 780 && event.clientX <= 850 && event.clientX >= 60) {
    let column = 0
    for (let c = 0; c < board.length; c++) {
      if (event.clientX >= (rowGap * (c + 1) + 1) && event.clientX <= (rowGap * 2) * (c + 1)) {
        column = c;
      }
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
    drawPlayers(usernameList);

    window.requestAnimationFrame(draw_frame);
  }
  window.requestAnimationFrame(draw_frame);
}

function drawText(text: string): void {
  ctx.fillStyle = "black";
  ctx.fillRect(230, 20, 320, 75);
  ctx.fillStyle = "red";
  ctx.font = `40px Verdana`;
  ctx.fillText(text, 250, 70);
}

function drawPlayer(username: string, i: number): void {
  ctx.fillStyle = colors[i+1];
  ctx.fillRect(840, 150 + (i * 70), 150, 60);
  ctx.fillStyle = "black";
  ctx.font = `30px Verdana`;
  ctx.fillText(username, 850, 190 + (i * 70));
  
}

function drawPlayers(usernameList: string[]) {
  for (let i = 0; i < usernameList.length; i++) {
    drawPlayer(usernameList[i], i)
  }
}

function drawBoard(): void {
  ctx.fillStyle = "#0B0B6F";
  ctx.fillRect(0, 0, 1500, 780);
  let x = 100;
  board.forEach(column => {
    let y = 175;
    column.forEach(cell => {
      drawCircle(x, y, 30, colors[cell])
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

function gameStartUI() {
  document.getElementById("joinButton").style.display = 'none';
  document.getElementById("hostButton").style.display = 'none';
  document.getElementById("joinID").style.display = 'none';
  document.getElementById("username").style.display = 'none';
  document.getElementById("rematchButton").style.display = 'none';
  document.getElementById("startButton").style.display = 'none';
}

function lobbyUI() {
  document.getElementById("joinButton").style.display = 'none';
  document.getElementById("hostButton").style.display = 'none';
  document.getElementById("joinID").style.display = 'none';
  document.getElementById("username").style.display = 'none';
  document.getElementById("rematchButton").style.display = 'none';
}

main()
