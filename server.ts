import { Socket } from "socket.io";
const options = {
  cors: {
    origin: ["http://75.136.67.139", "http://localhost", "https://games.dalkson.com"],
    methods: ["GET", "POST"]
  }
};
const io = require("socket.io")(1234, options
);


type Player = {
  username: string;
  id: string;
}

type Room = {
  roomNumber: number;
  players: Player[];
  turn: number;
  board: number[][];
  state: string;
}

let rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
  console.log("user connected", socket.id);
  socket.on("disconnect", (reason) => {
    console.log("user disconnected", socket.id);
  });

  socket.on("join", (roomNumber: number, username: string) => {
    let state = roomState(roomNumber);
    if (state == 1) {
      socket.join(String(roomNumber));
      let room: Room = rooms[roomIndex(roomNumber)];
      room.players.push({username: username, id: socket.id});
      socket.emit("joined", roomNumber, room.players.length);
      var randomnumber = Math.floor(Math.random() * (room.players.length - 1 + 1)) + 1;
      room.turn = randomnumber;
      let usernameList: string[] = [];
      for (let i = 0; i < room.players.length; i++) {
        usernameList.push(room.players[i].username);
      }
      io.to(String(roomNumber)).emit("players", usernameList);
    } else if (state == 2) {
      socket.emit("joined", -2);
    } else {
      socket.emit("joined", -1);
    }
  });

  socket.on("host", (username: string) => {
    let roomNumber = Math.floor(1000 + Math.random() * 9000);
    if(rooms.length != 0 ) {
      while (roomState(roomNumber) != 0) {
          roomNumber = Math.floor(1000 + Math.random() * 9000);
      }
    }
    rooms.push({roomNumber: roomNumber, players: [{username: username, id: socket.id}], turn: 1, board: [
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
    ], state: "waiting"});
    socket.join(String(roomNumber));
    socket.emit("joined", roomNumber, 1)
    let usernameList: string[] = [username];
    io.to(String(roomNumber)).emit("players", usernameList);
  });

  socket.on("startGame", (roomNumber: number) => {
    if (roomNumber == 0) {return;}
    let room = rooms[roomIndex(roomNumber)];
    if (room.players[0].id != socket.id) {return;}
    room.state = "inplay";
    io.to(String(roomNumber)).emit("gamestart", room.turn);
  })

  socket.on("rematch", (roomNumber: number) => {
    if (roomNumber != 0) {
      let room: Room = rooms[roomIndex(roomNumber)];
      if (room.state == "over") {
        clearBoard(room);
        io.to(String(roomNumber)).emit("rematch", room.turn);
      }
    }
  })

  socket.on("dropDisk", function (column: number, roomNumber: number): void {
    if (roomNumber == 0) {return;}
    let room = rooms[roomIndex(roomNumber)]
    if (room.state != "inplay") {return;}
    let players = room.players;
    let player: number;
    for (let i = 0; i < players.length; i++) {
      if (players[i].id == socket.id) {
        player = i + 1;
      }
    }
    if (player != room.turn) {return;}
    if (isFull(room, column)) {return;}
    dropDisk(player, column, room);
    checkWin(roomNumber);
    if (room.turn < players.length) {
      room.turn++;
    } else {room.turn = 1;}
    io.to(String(roomNumber)).emit("droppedDisk", player, column, room.turn);
  });
});

function roomState(roomNumber: number): number {
  for (const room of rooms) {
    if(room.roomNumber == roomNumber) {
      if(room.players.length == 6) {
        return 2; // full
      }
      return 1; // exist not full
    } 
  }
  return 0; // doesnt exist
}

function roomIndex(roomNumber: number): number {
  for (const [i, room] of rooms.entries()) {
    if(room.roomNumber == roomNumber) {
      return i;
    } 
  }
  return -1; //doesnt exit
}

function checkWin(roomNumber: number): void {
  console.log("checkWin");
  let room = rooms[roomIndex(roomNumber)];
  let emptyCells = 0;
  let winner = 0;
  let x = 0;
  room.board.forEach(column => {
    let y = 0;
    column.forEach(cell => {
      if(cell != 0) {
        if(x <= 3) {
          if(cell == room.board[x+1][y] && cell == room.board[x+2][y] && cell == room.board[x+3][y]) {
            winner = cell;
          }
        }
        if(cell == room.board[x][y+1] && cell == room.board[x][y+2] && cell == room.board[x][y+3]) {
          winner = cell;
        }
        if(x <= 3) {
          if(cell == room.board[x+1][y-1] && cell == room.board[x+2][y-2] && cell == room.board[x+3][y-3]) {
            winner = cell;
          }
        }
        if(x >= 3) {
          if(cell == room.board[x-1][y-1] && cell == room.board[x-2][y-2] && cell == room.board[x-3][y-3]) {
            winner = cell;
          }
        }
      } else {emptyCells++}
      y++;
    });
    x++;
  });
  if (winner != 0) {
    console.log("game is over " + winner);
    io.to(String(roomNumber)).emit("gameover", winner);
    room.state = "over";
  }
  if (emptyCells == 0) {
    io.to(String(roomNumber)).emit("gameover", -1);
    room.state = "over";
  }
}

function dropDisk(player: number, column: number, room: Room): void {;
  for (let index = room.board[column].length - 1; index >= 0; index--) {
    const cell = room.board[column][index];
    if(cell == 0) {
      room.board[column][index] = player;
        return;
    }
  }
}

function clearBoard(room: Room) {
  room.board = [
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
  room.state = "inplay";
}

function isFull(room: Room, column: number): boolean {
  if (room.board[column][0] == 0) {return false;} else {return true;}
}
