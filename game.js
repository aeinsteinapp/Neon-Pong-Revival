const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// Make canvas responsive to screen size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Color themes
const colorThemes = {
  'Neon Red': {
    player: '#FF0000',
    ai: '#FF0066',
    ball: '#FF3333',
    accent: '#FF0000'
  },
  'Cyan/Magenta': {
    player: '#00FFFF',
    ai: '#FF00FF',
    ball: '#FFFFFF',
    accent: '#00FFFF'
  },
  'Green/Yellow': {
    player: '#00FF00',
    ai: '#FFFF00',
    ball: '#FFFFFF',
    accent: '#00FF00'
  },
  'Purple/Orange': {
    player: '#9D00FF',
    ai: '#FF6600',
    ball: '#FFFFFF',
    accent: '#9D00FF'
  },
  'Blue/Pink': {
    player: '#0066FF',
    ai: '#FF66CC',
    ball: '#FFFFFF',
    accent: '#0066FF'
  }
};

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'settings', 'gameover'
let difficulty = localStorage.getItem('pongDifficulty') || 'Normal';
let colorTheme = localStorage.getItem('pongColorTheme') || 'Neon Red';
let playerScore = 0;
let aiScore = 0;
let highScore = parseInt(localStorage.getItem('pongHighScore') || '0');

// Paddle settings
const paddleWidth = canvas.width * 0.02;
const paddleHeight = canvas.height * 0.15;
let playerY = (canvas.height - paddleHeight) / 2;
let aiY = playerY;

// Ball settings
const ballSize = canvas.width * 0.015;
let ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  dx: canvas.width * 0.004,
  dy: canvas.height * 0.004,
  speed: 1
};

// Difficulty settings
const difficulties = {
  'Easy': 0.02,
  'Normal': 0.04,
  'Hard': 0.06,
  'Insane': 0.1
};

// Touch/Mouse handling
let touchY = canvas.height / 2;
let isTouching = false;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isTouching = true;
  touchY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (isTouching) {
    touchY = e.touches[0].clientY;
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isTouching = false;
  
  // Handle menu touches
  if (gameState === 'menu') {
    handleMenuTouch(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  } else if (gameState === 'settings') {
    handleSettingsTouch(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  } else if (gameState === 'gameover') {
    handleGameOverTouch(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
});

canvas.addEventListener('click', (e) => {
  if (gameState === 'menu') {
    handleMenuTouch(e.clientX, e.clientY);
  } else if (gameState === 'settings') {
    handleSettingsTouch(e.clientX, e.clientY);
  } else if (gameState === 'gameover') {
    handleGameOverTouch(e.clientX, e.clientY);
  }
});

// Get current colors
function getColors() {
  return colorThemes[colorTheme];
}

// Drawing functions with neon glow
function drawRect(x, y, w, h, color, glowColor) {
  // Glow effect
  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor || color;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
}

function drawCircle(x, y, r, color, glowColor) {
  ctx.shadowBlur = 25;
  ctx.shadowColor = glowColor || color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawText(text, x, y, size, color, align = 'center') {
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px 'Orbitron', 'Arial Black', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function drawButton(text, x, y, w, h, color) {
  // Button background with glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;
  
  // Button text
  drawText(text, x + w/2, y + h/2, h * 0.4, color);
  
  return {x, y, w, h};
}

// Menu handling
let menuButtons = [];

function drawMenu() {
  const colors = getColors();
  
  // Background
  drawRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 10, 0.95)');
  
  // Title
  drawText("DeadmanXXXII's", canvas.width/2, canvas.height * 0.25, canvas.height * 0.05, colors.player);
  drawText("Classic Pong", canvas.width/2, canvas.height * 0.35, canvas.height * 0.08, colors.ai);
  
  // Buttons
  menuButtons = [];
  const btnW = canvas.width * 0.5;
  const btnH = canvas.height * 0.08;
  const startY = canvas.height * 0.5;
  
  menuButtons.push({
    ...drawButton("START GAME", (canvas.width - btnW)/2, startY, btnW, btnH, '#00FF00'),
    action: 'start'
  });
  
  menuButtons.push({
    ...drawButton("SETTINGS", (canvas.width - btnW)/2, startY + btnH * 1.5, btnW, btnH, colors.accent),
    action: 'settings'
  });
  
  // High Score
  drawText(`High Score: ${highScore}`, canvas.width/2, canvas.height * 0.85, canvas.height * 0.03, '#FFFFFF');
}

function handleMenuTouch(x, y) {
  for (let btn of menuButtons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      if (btn.action === 'start') {
        startGame();
      } else if (btn.action === 'settings') {
        gameState = 'settings';
      }
    }
  }
}

// Settings screen
let settingsButtons = [];

function drawSettings() {
  const colors = getColors();
  
  // Background
  drawRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 10, 0.95)');
  
  // Title
  drawText("SETTINGS", canvas.width/2, canvas.height * 0.15, canvas.height * 0.06, colors.accent);
  
  // Buttons
  settingsButtons = [];
  const btnW = canvas.width * 0.6;
  const btnH = canvas.height * 0.08;
  const startY = canvas.height * 0.3;
  const spacing = btnH * 1.3;
  
  // Difficulty button
  settingsButtons.push({
    ...drawButton(`DIFFICULTY: ${difficulty}`, (canvas.width - btnW)/2, startY, btnW, btnH, '#FFFF00'),
    action: 'difficulty'
  });
  
  // Color theme button with preview
  settingsButtons.push({
    ...drawButton(`THEME: ${colorTheme}`, (canvas.width - btnW)/2, startY + spacing, btnW, btnH, colors.accent),
    action: 'color'
  });
  
  // Color preview boxes
  const previewSize = canvas.height * 0.03;
  const previewY = startY + spacing + btnH + canvas.height * 0.02;
  const previewSpacing = canvas.width * 0.08;
  const previewStartX = canvas.width/2 - previewSpacing;
  
  drawText("Player", previewStartX, previewY - previewSize, canvas.height * 0.02, '#FFFFFF');
  drawRect(previewStartX - previewSize/2, previewY, previewSize, previewSize, colors.player, colors.player);
  
  drawText("AI", previewStartX + previewSpacing, previewY - previewSize, canvas.height * 0.02, '#FFFFFF');
  drawRect(previewStartX + previewSpacing - previewSize/2, previewY, previewSize, previewSize, colors.ai, colors.ai);
  
  drawText("Ball", previewStartX + previewSpacing * 2, previewY - previewSize, canvas.height * 0.02, '#FFFFFF');
  drawCircle(previewStartX + previewSpacing * 2, previewY + previewSize/2, previewSize/2, colors.ball, colors.ball);
  
  // Back button
  settingsButtons.push({
    ...drawButton("BACK TO MENU", (canvas.width - btnW)/2, canvas.height * 0.8, btnW, btnH, '#FF0000'),
    action: 'back'
  });
}

function handleSettingsTouch(x, y) {
  for (let btn of settingsButtons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      if (btn.action === 'difficulty') {
        changeDifficulty();
      } else if (btn.action === 'color') {
        changeColorTheme();
      } else if (btn.action === 'back') {
        gameState = 'menu';
      }
    }
  }
}

function changeDifficulty() {
  const levels = ['Easy', 'Normal', 'Hard', 'Insane'];
  const currentIndex = levels.indexOf(difficulty);
  difficulty = levels[(currentIndex + 1) % levels.length];
  localStorage.setItem('pongDifficulty', difficulty);
}

function changeColorTheme() {
  const themes = Object.keys(colorThemes);
  const currentIndex = themes.indexOf(colorTheme);
  colorTheme = themes[(currentIndex + 1) % themes.length];
  localStorage.setItem('pongColorTheme', colorTheme);
}

function startGame() {
  gameState = 'playing';
  playerScore = 0;
  aiScore = 0;
  resetBall();
}

// Game Over screen
let gameOverButtons = [];

function drawGameOver() {
  const colors = getColors();
  
  drawRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 10, 0.9)');
  
  const winner = playerScore > aiScore ? "YOU WIN!" : "YOU LOSE!";
  const winColor = playerScore > aiScore ? '#00FF00' : '#FF0000';
  
  drawText(winner, canvas.width/2, canvas.height * 0.3, canvas.height * 0.08, winColor);
  drawText(`Your Score: ${playerScore}`, canvas.width/2, canvas.height * 0.45, canvas.height * 0.04, colors.player);
  drawText(`AI Score: ${aiScore}`, canvas.width/2, canvas.height * 0.52, canvas.height * 0.04, colors.ai);
  drawText(`High Score: ${highScore}`, canvas.width/2, canvas.height * 0.59, canvas.height * 0.04, '#FFFF00');
  
  gameOverButtons = [];
  const btnW = canvas.width * 0.5;
  const btnH = canvas.height * 0.08;
  
  gameOverButtons.push({
    ...drawButton("PLAY AGAIN", (canvas.width - btnW)/2, canvas.height * 0.7, btnW, btnH, '#00FF00'),
    action: 'restart'
  });
  
  gameOverButtons.push({
    ...drawButton("MENU", (canvas.width - btnW)/2, canvas.height * 0.82, btnW, btnH, colors.accent),
    action: 'menu'
  });
}

function handleGameOverTouch(x, y) {
  for (let btn of gameOverButtons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      if (btn.action === 'restart') {
        startGame();
      } else if (btn.action === 'menu') {
        gameState = 'menu';
      }
    }
  }
}

// Game logic
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * canvas.width * 0.004;
  ball.dy = (Math.random() - 0.5) * canvas.height * 0.006;
}

function updateGame() {
  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Ball bounce off top/bottom
  if (ball.y - ballSize < 0 || ball.y + ballSize > canvas.height) {
    ball.dy *= -1;
  }
  
  // Player paddle follows touch
  if (isTouching && touchY < canvas.height / 2) {
    const targetY = touchY - paddleHeight / 2;
    playerY += (targetY - playerY) * 0.15;
  }
  
  // Keep player paddle in bounds
  playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
  
  // AI movement
  const aiSpeed = difficulties[difficulty] * canvas.height;
  const aiTarget = ball.y - paddleHeight / 2;
  if (aiY < aiTarget - aiSpeed) {
    aiY += aiSpeed;
  } else if (aiY > aiTarget + aiSpeed) {
    aiY -= aiSpeed;
  }
  aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
  
  // Paddle collisions
  const leftPaddleX = paddleWidth;
  const rightPaddleX = canvas.width - paddleWidth * 2;
  
  // Player paddle collision
  if (ball.x - ballSize < leftPaddleX && 
      ball.y > playerY && 
      ball.y < playerY + paddleHeight &&
      ball.dx < 0) {
    ball.dx = Math.abs(ball.dx) * 1.05;
    ball.dy += (Math.random() - 0.5) * canvas.height * 0.002;
  }
  
  // AI paddle collision
  if (ball.x + ballSize > rightPaddleX && 
      ball.y > aiY && 
      ball.y < aiY + paddleHeight &&
      ball.dx > 0) {
    ball.dx = -Math.abs(ball.dx) * 1.05;
    ball.dy += (Math.random() - 0.5) * canvas.height * 0.002;
  }
  
  // Score points
  if (ball.x - ballSize < 0) {
    aiScore++;
    resetBall();
  }
  if (ball.x + ballSize > canvas.width) {
    playerScore++;
    if (playerScore > highScore) {
      highScore = playerScore;
      localStorage.setItem('pongHighScore', highScore.toString());
    }
    resetBall();
  }
  
  // Check for game over (first to 10)
  if (playerScore >= 10 || aiScore >= 10) {
    gameState = 'gameover';
  }
}

function drawGame() {
  const colors = getColors();
  
  // Background with fade effect
  drawRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 20, 0.3)');
  
  // Center line
  ctx.setLineDash([canvas.height * 0.02, canvas.height * 0.02]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Paddles with neon glow
  drawRect(0, playerY, paddleWidth, paddleHeight, colors.player, colors.player);
  drawRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight, colors.ai, colors.ai);
  
  // Ball with neon glow
  drawCircle(ball.x, ball.y, ballSize, colors.ball, colors.ball);
  
  // Scores
  drawText(playerScore.toString(), canvas.width * 0.25, canvas.height * 0.1, canvas.height * 0.08, colors.player);
  drawText(aiScore.toString(), canvas.width * 0.75, canvas.height * 0.1, canvas.height * 0.08, colors.ai);
  
  // Title at top
  drawText("DeadmanXXXII's Classic Pong", canvas.width/2, canvas.height * 0.05, canvas.height * 0.025, '#FFFFFF');
}

// Main game loop
function gameLoop() {
  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'settings') {
    drawSettings();
  } else if (gameState === 'playing') {
    updateGame();
    drawGame();
  } else if (gameState === 'gameover') {
    drawGameOver();
  }
  
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();