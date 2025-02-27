const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const grid = 64;

const wallCanvas = document.createElement('canvas');
const wallCtx = wallCanvas.getContext('2d');
wallCanvas.width = wallCanvas.height = grid;

wallCtx.fillStyle = '#5b5530';
wallCtx.fillRect(0, 0, grid, grid);
wallCtx.fillStyle = '#a19555';

wallCtx.fillRect(1, 1, grid - 2, 20);

wallCtx.fillRect(0, 23, 20, 18);
wallCtx.fillRect(22, 23, 42, 18);

wallCtx.fillRect(0, 43, 42, 20);
wallCtx.fillRect(44, 43, 20, 20);

let playerDir = { row: 0, col: 0 };
let playerPos = { row: 0, col: 0 };
let rAF = null;
let width = 0;


const types = {
  wall: '#',
  player: '@',
  playerOnGoal: '+',
  block: '$',
  blockOnGoal: '*',
  goal: '.',
  empty: ' '
};

const level1 =`
#######
#     #
# $ # ##
# #  . #
#    # #
## #   #
 #@  ###
 #####
`;

const level2 =`
#######
#  @  #
# $ $ #
# .$. #
# $.$ #
# .#. #
#######
`;

const level3 =`
  #####
###   #
#.@$  #
### $.#
#.##$ #
# # . ##
#$ *$$.#
#   .  #
########
`;


const cells = [];

const levels = [level1, level2, level3];
let currentLevelIndex = 0;

function loadLevel(levelIndex) {
  const levelData = levels[levelIndex];

  cells.length = 0;
  width = 0;

  levelData.split('\n')
    .filter(rowData => !!rowData)
    .forEach((rowData, row) => {
      cells[row] = [];

      if (rowData.length > width) {
        width = rowData.length;
      }

      rowData.split('').forEach((colData, col) => {
        cells[row][col] = colData;

        if (colData === types.player || colData === types.playerOnGoal) {
          playerPos = { row, col };
        }
      });
    });

  canvas.width = width * grid;
  canvas.height = cells.length * grid;
}

loadLevel(currentLevelIndex);


canvas.width = width * grid;
canvas.height = cells.length * grid;

function move(startPos, endPos) {
  const startCell = cells[startPos.row][startPos.col];
  const endCell = cells[endPos.row][endPos.col];

  const isPlayer = startCell === types.player || startCell === types.playerOnGoal;

  switch(startCell) {

    case types.player:
    case types.block:
      cells[startPos.row][startPos.col] = types.empty;
      break;

    case types.playerOnGoal:
    case types.blockOnGoal:
      cells[startPos.row][startPos.col] = types.goal;
      break;
  }

  switch(endCell) {

    case types.empty:
      cells[endPos.row][endPos.col] = isPlayer ? types.player : types.block;
      break;

    case types.goal:
      cells[endPos.row][endPos.col] = isPlayer ? types.playerOnGoal : types.blockOnGoal;
      break;
  }
}

function showWin() {
  cancelAnimationFrame(rAF);

  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);

  setTimeout(() => {
    currentLevelIndex++;
    if (currentLevelIndex >= levels.length) {
      currentLevelIndex = 0;
    }
    loadLevel(currentLevelIndex);
    requestAnimationFrame(loop);
  }, 2000);
}

function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  const row = playerPos.row + playerDir.row;
  const col = playerPos.col + playerDir.col;
  const cell = cells[row][col];
  switch(cell) {

    case types.empty:
    case types.goal:
      move(playerPos, { row, col });

      playerPos.row = row;
      playerPos.col = col;
      break;

    case types.wall:
      break;

    case types.block:
    case types.blockOnGoal:
      const nextRow = row + playerDir.row;
      const nextCol = col + playerDir.col;
      const nextCell = cells[nextRow][nextCol];

      if (nextCell === types.empty || nextCell === types.goal) {
        move({ row, col }, { row: nextRow, col: nextCol });
        move(playerPos, { row, col });

        playerPos.row = row;
        playerPos.col = col;
      }
      break;
  }

  playerDir = { row: 0, col: 0 };

  let allBlocksOnGoals = true;

  context.strokeStyle = 'black';
  context.lineWidth = 2;
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col];

      if (cell === types.wall) {
        context.drawImage(wallCanvas, col * grid, row * grid);
      }

      if (cell === types.block || cell === types.blockOnGoal) {
        if (cell === types.block) {
          context.fillStyle = '#ffbb5b';

          allBlocksOnGoals = false;
        }
        else {
          context.fillStyle = '#ba6a15';
        }

        context.fillRect(col * grid, row * grid, grid, grid);
        context.strokeRect(col * grid, row * grid, grid, grid);
        context.strokeRect((col + 0.1) * grid, (row + 0.1) * grid, grid - (0.2 * grid), grid - (0.2 * grid));

        context.beginPath();
        context.moveTo((col + 0.1) * grid, (row + 0.1) * grid);
        context.lineTo((col + 0.9) * grid, (row + 0.9) * grid);
        context.moveTo((col + 0.9) * grid, (row + 0.1) * grid);
        context.lineTo((col + 0.1) * grid, (row + 0.9) * grid);
        context.stroke();
      }

      if (cell === types.goal || cell === types.playerOnGoal) {
        context.fillStyle = '#914430';
        context.beginPath();
        context.arc((col + 0.5) * grid, (row + 0.5) * grid, 10, 0, Math.PI * 2);
        context.fill();
      }

      if (cell === types.player || cell === types.playerOnGoal) {
        context.fillStyle = 'black';
        context.beginPath();

        context.arc((col + 0.5) * grid, (row + 0.3) * grid, 8, 0, Math.PI * 2);
        context.fill();
        context.fillRect((col + 0.48) * grid, (row + 0.3) * grid, 2, grid/ 2.5 );
        context.fillRect((col + 0.3) * grid, (row + 0.5) * grid, grid / 2.5, 2);
        context.moveTo((col + 0.5) * grid, (row + 0.7) * grid);
        context.lineTo((col + 0.65) * grid, (row + 0.9) * grid);
        context.moveTo((col + 0.5) * grid, (row + 0.7) * grid);
        context.lineTo((col + 0.35) * grid, (row + 0.9) * grid);
        context.stroke();
      }
    }
  }

  if (allBlocksOnGoals) {
    showWin();
  }
}

document.addEventListener('keydown', function(e) {
  playerDir = { row: 0, col: 0};

  if (e.which === 37) {
    playerDir.col = -1;
  }
  else if (e.which === 38) {
    playerDir.row = -1;
  }
  else if (e.which === 39) {
    playerDir.col = 1;
  }
  else if (e.which === 40) {
    playerDir.row = 1;
  }
});

loadLevel(currentLevelIndex);
requestAnimationFrame(loop);