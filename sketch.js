let cvsWrapper = null;
let scale;
let bgX, baseX, baseHeight;

let birdY, birdVY, birdAY;
let birdWidth, birdHeight;
let triAng;
let flapNum;
let assets = {};

let pipeArr = Array(4);
let pipeX;
let pipeWidth, pipeHeight, pipeChannel;
let numWidth;

let state = {};
const urlPrefix = 'https://raw.githubusercontent.com/kerorojason/Flappy-Bird-Game/master/';
function preload() {
  assets.birdColorArr = ['blue', 'red', 'yellow'].map(color =>
    ['upflap', 'midflap', 'downflap'].map(flap =>
      loadImage(`${urlPrefix}assets/sprites/${color}bird-${flap}.png`)
    )
  );
  assets.bgArr = ['day', 'night'].map(time =>
    loadImage(`${urlPrefix}assets/sprites/background-${time}.png`)
  );
  ['base', 'gameover', 'message'].forEach(
    item => (assets[`${item}Img`] = loadImage(`${urlPrefix}assets/sprites/${item}.png`))
  );
  assets.lowerPipeImg = loadImage(`${urlPrefix}assets/sprites/pipe-green-lower.png`);
  assets.upperPipeImg = loadImage(`${urlPrefix}assets/sprites/pipe-green-upper.png`);

  assets.soundArr = ['die', 'hit', 'point', 'swoosh', 'wing'].forEach(
    item => (assets[item] = loadSound(`${urlPrefix}assets/audio/${item}.wav`))
  );
  assets.numArr = [];
  for (let i = 0; i < 10; i++) {
    assets.numArr.push(loadImage(`${urlPrefix}assets/sprites/${i}.png`));
  }
}

// Game basic setup.
function setup() {
  // Mounting canvas onto div for convenient styling.
  cvsWrapper = document.getElementById('canvasWrapper');
  const myCanvas = createCanvas(cvsWrapper.offsetWidth, cvsWrapper.offsetHeight);
  myCanvas.parent('canvasWrapper');

  // random choose bird and random bg
  assets.birdArr = assets.birdColorArr[Math.floor(Math.random() * 3)];
  assets.bgImg = assets.bgArr[Math.floor(Math.random() * 2)];
  // bg setup
  bgX = 0;
  baseX = 0;
  scale = width / assets.bgImg.width;
  bgWidth = assets.bgImg.width;
  bgHeight = assets.bgImg.height;
  baseHeight = assets.baseImg.height;

  // bird setup
  [birdVY, birdAY, triAng, flapNum] = [0, 10, 0, 0];
  [birdWidth, birdHeight] = [assets.birdArr[0].width * scale, assets.birdArr[0].height * scale];

  // pipe setup
  pipeWidth = assets.upperPipeImg.width * scale;
  pipeHeight = assets.upperPipeImg.height * scale;
  pipeChannel = height / 3.5;
  numWidth = assets.numArr[0].width * scale;
  numHeight = assets.numArr[0].width * scale;
  state = {
    score: 0,
    channelRange: height / 2,
    channelWidth: height / 4,
    playState: 'ready' //ready, start, gameover, falling
  };
  initPipeArr();
}

// Render function (called per frame.)
function draw() {
  drawBackground();
  if (state.playState === 'start') {
    drawBird();
    drawPipe();
  } else if (state.playState === 'falling') {
    fall();
  } else {
    drawFixedBird();
    drawMenu();
  }
  drawBase();
  updateScore();
  drawScore();
  checkCollision();
}

function drawBackground() {
  bgX--;
  if (bgX < -width) {
    bgX = 0;
  }
  resetMatrix();
  image(assets.bgImg, bgX, 0, bgWidth * scale, bgHeight * scale);
  image(assets.bgImg, bgX + bgWidth * scale, 0, bgWidth * scale, bgHeight * scale);
}

function drawBird() {
  birdVY += birdAY * 0.028;
  birdY += birdVY;
  triAng += 0.03;
  translate(width / 2, birdY);
  rotate(triAng);
  flapNum = Math.floor(-bgX / 6) % 3;
  assets.birdImg = assets.birdArr[flapNum];
  image(assets.birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
}

function drawFixedBird() {
  flapNum = Math.floor(-bgX / 6) % 3;
  assets.birdImg = assets.birdArr[flapNum];
  birdY = height / 2 + height / 10;
  image(
    assets.birdImg,
    width / 2 - birdWidth / 2,
    height / 2 - birdHeight / 2 + height / 10,
    birdWidth,
    birdHeight
  );
}

function drawPipe() {
  resetMatrix();
  pipeArr.forEach((pipeObj, idx) => {
    pipeObj.x -= 2.5;
    image(assets.upperPipeImg, pipeObj.x, pipeObj.y1, pipeWidth, pipeHeight);
    image(assets.lowerPipeImg, pipeObj.x, pipeObj.y2, pipeWidth, pipeHeight);
    if (pipeObj.x < -pipeWidth) {
      pipeArr[idx] = initPipe();
    }
  });
}
function drawMenu() {
  resetMatrix();
  drawCenter(assets.messageImg, width / 2, height / 2);
}

function drawBase() {
  baseX -= 2.5;
  if (baseX < -width) {
    baseX = 0;
  }
  image(
    assets.baseImg,
    baseX,
    (bgHeight - baseHeight) * scale,
    bgWidth * scale,
    baseHeight * scale
  );
  image(
    assets.baseImg,
    baseX + bgWidth * scale,
    (bgHeight - baseHeight) * scale,
    bgWidth * scale,
    baseHeight * scale
  );
}

function updateScore() {
  pipeArr.forEach(pipe => {
    if (pipe.x <= width / 2 && !pipe.scored) {
      state.score++;
      pipe.scored = true;
      assets.point.play();
      updateDifficulty();
    }
  });
}

function drawScore() {
  state.score
    .toString()
    .split('')
    .forEach((num, idx) =>
      image(
        assets.numArr[Number(num)],
        width / 17 + idx * numWidth * 1.07,
        height / 20,
        numWidth,
        numHeight
      )
    );
}

function initPipeArr() {
  for (let i = 0; i < pipeArr.length; i++) {
    let y1 = (-(Math.random() * height) * 2) / 5;
    let y2 = y1 + pipeHeight + pipeChannel;
    pipeArr[i] = {
      ...initPipe(),
      x: (i * (2 * width + pipeWidth)) / pipeArr.length + bgWidth * 2,
      scored: false
    };
  }
}

function initPipe() {
  let y1 =
    (height - baseHeight * scale) / 2 - (Math.random() * state.channelRange) / 2 - pipeHeight;
  let y2 = y1 + pipeHeight + state.channelWidth;
  return { x: width * 2, y1, y2 };
}

function keyPressed() {
  if (keyCode === 32) {
    birdVY = -6;
    triAng = -PI / 4;
    if (state.playState === 'gameOver') {
      restart();
      loop();
      state.playState = 'ready';
    } else if (state.playState !== 'falling') {
      state.playState = 'start';
      assets.wing.play();
    }
  }
}

function touchStarted() {
  birdVY = -6;
  triAng = -PI / 4;
  if (state.playState === 'gameOver') {
    restart();
    loop();
    state.playState = 'ready';
  } else if (state.playState !== 'falling') {
    state.playState = 'start';
    assets.wing.play();
  }
}

function updateDifficulty() {
  if (state.score >= 10 && state.score % 10 === 0) {
    state.channelWidth *= 0.9;
    state.channelRange *= 1.1;
  }
}

function checkCollision() {
  if (birdY + birdHeight / 2 >= (bgHeight - baseHeight) * scale) {
    assets.hit.play();
    gameOver();
  }
  pipeArr.forEach(pipe => {
    if (
      pipe.x >= width / 2 - pipeWidth - birdWidth / 3.5 &&
      pipe.x <= width / 2 + birdWidth / 3.5
    ) {
      if (birdY < pipe.y1 + pipeHeight + birdHeight / 2.5 || birdY > pipe.y2 - birdHeight / 2.5) {
        assets.hit.play();
        gameOver();
      }
    }
  });
}

function drawCenter(img, x, y) {
  image(
    img,
    x - (img.width * scale) / 2,
    y - (img.height * scale) / 2,
    img.width * scale,
    img.height * scale
  );
}
function gameOver() {
  state.playState = 'falling';
  noLoop();
  drawCenter(assets.gameoverImg, width / 2, height / 2);
  // automatically restart after 2 second
  setTimeout(() => {
    state.playState = 'gameOver';
  }, 1500);
  state.score = 0;
}

function restart() {
  // random choose bird and random bg
  assets.birdArr = assets.birdColorArr[Math.floor(Math.random() * 3)];
  assets.bgImg = assets.bgArr[Math.floor(Math.random() * 2)];
  // init bird
  [birdVY, birdAY, triAng, flapNum] = [0, 10, 0, 0];
  initPipeArr();
  state.channelRange = height / 2;
  state.channelWidth = height / 4;
}
