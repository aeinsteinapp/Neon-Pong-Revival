const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

let paddleHeight = 100, paddleWidth = 15;
let playerY = (canvas.height - paddleHeight) / 2;
let aiY = playerY;
let ball = { x: canvas.width / 2, y: canvas.height / 2, r: 10, dx: 5, dy: 5 };
let playerScore = 0, aiScore = 0;

document.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  playerY = e.clientY - rect.top - paddleHeight / 2;
});

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawText(text, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = "32px Orbitron, sans-serif";
  ctx.fillText(text, x, y);
}

function update() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height) ball.dy *= -1;

  if (ball.x - ball.r < paddleWidth &&
      ball.y > playerY && ball.y < playerY + paddleHeight) {
    ball.dx = -ball.dx;
  }

  if (ball.x + ball.r > canvas.width - paddleWidth &&
      ball.y > aiY && ball.y < aiY + paddleHeight) {
    ball.dx = -ball.dx;
  }

  aiY += ((ball.y - (aiY + paddleHeight / 2))) * 0.05;

  if (ball.x - ball.r < 0) { aiScore++; resetBall(); }
  if (ball.x + ball.r > canvas.width) { playerScore++; resetBall(); }
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx *= -1;
}

function render() {
  drawRect(0, 0, canvas.width, canvas.height, "rgba(0,0,20,0.5)");
  drawRect(0, playerY, paddleWidth, paddleHeight, "#0ff");
  drawRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight, "#f0f");
  drawCircle(ball.x, ball.y, ball.r, "#fff");
  drawText(playerScore, canvas.width / 4, 50, "#0ff");
  drawText(aiScore, 3 * canvas.width / 4, 50, "#f0f");
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
