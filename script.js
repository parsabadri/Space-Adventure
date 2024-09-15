const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const scoreDisplay = document.getElementById("score");
const scoreboard = document.getElementById("scoreboard");

canvas.width = 800;
canvas.height = 600;

let speedMultiplier = 1; // Normal speed
let doubleScoreActive = false; // Track if the double-score power-up is active
let doubleScoreTimer = 0; // Countdown timer for double-score effect

let spaceship = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  speed: 5,
  dx: 0,
  image: null, // Will store the spaceship image
};

let asteroids = [];
let stars = [];
let score = 0;
let gameInterval;
let gameActive = false;
let highScores = [];

// Load spaceship SVG image
function loadSpaceshipImage() {
  spaceship.image = new Image();
  spaceship.image.src = "./Assets/spaceship.svg"; // Path to your spaceship SVG
}

// Initialize high scores from localStorage
function loadScores() {
  const storedScores = localStorage.getItem("highScores");
  if (storedScores) {
    highScores = JSON.parse(storedScores);
  }
  updateScoreboard();
}

// Save high scores to localStorage
function saveScores() {
  localStorage.setItem("highScores", JSON.stringify(highScores));
}

// Update the scoreboard in the UI
function updateScoreboard() {
  scoreboard.innerHTML = "";
  highScores.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${index + 1}. <strong>${entry.name}</strong>: ${
      entry.score
    }`;
    scoreboard.appendChild(li);
  });
}

// Add a new score to the scoreboard and keep it sorted
function addScore(name, score) {
  highScores.push({ name, score });
  highScores.sort((a, b) => b.score - a.score); // Sort in descending order
  highScores = highScores.slice(0, 5); // Keep only top 5 scores
  saveScores();
  updateScoreboard();
}

function drawSpaceship() {
  if (spaceship.image && spaceship.image.complete) {
    ctx.drawImage(
      spaceship.image,
      spaceship.x,
      spaceship.y,
      spaceship.width,
      spaceship.height
    );
  } else {
    // Fallback to drawing a rectangle if image hasn't loaded yet
    ctx.fillStyle = "white";
    ctx.fillRect(spaceship.x, spaceship.y, spaceship.width, spaceship.height);
  }
}

function updateSpaceship() {
  spaceship.x += spaceship.dx;

  // Boundary detection
  if (spaceship.x < 0) spaceship.x = 0;
  if (spaceship.x + spaceship.width > canvas.width)
    spaceship.x = canvas.width - spaceship.width;
}

function drawStar(
  ctx,
  cx,
  cy,
  spikes,
  outerRadius,
  innerRadius,
  isDoubleScore,
  isPinkStar
) {
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < 2 * spikes; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.sin(i * step);
    const y = cy - radius * Math.cos(i * step);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.lineWidth = 1;

  if (isPinkStar) {
    ctx.strokeStyle = "pink";
    ctx.fillStyle = "pink";
  } else {
    ctx.strokeStyle = "yellow";
    ctx.fillStyle = "yellow";
  }

  ctx.stroke();
  ctx.fill();

  if (isDoubleScore) {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("2X", cx, cy);
  }
}

function drawStars() {
  stars.forEach((star) => {
    drawStar(
      ctx,
      star.x + star.width / 2,
      star.y + star.height / 2,
      5,
      20,
      10,
      star.isDoubleScore
    );
  });
}

function createAsteroid() {
  let size = Math.random() * 40 + 10;
  let x = Math.random() * (canvas.width - size);
  let speed = Math.random() * 2 + 1;
  asteroids.push({ x, y: -size, width: size, height: size, speed });
}

function drawAsteroids() {
  asteroids.forEach((asteroid) => {
    ctx.fillStyle = "gray";
    ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
  });
}

function updateAsteroids() {
  asteroids.forEach((asteroid, index) => {
    asteroid.y += asteroid.speed;

    // Remove asteroids that go off the screen
    if (asteroid.y > canvas.height) {
      asteroids.splice(index, 1);
    }

    // Collision detection with spaceship
    if (
      asteroid.x < spaceship.x + spaceship.width &&
      asteroid.x + asteroid.width > spaceship.x &&
      asteroid.y < spaceship.y + spaceship.height &&
      asteroid.y + asteroid.height > spaceship.y
    ) {
      endGame();
    }
  });
}

function createStar() {
  let size = 20; // Diameter of the star
  let x = Math.random() * (canvas.width - size);
  let y = -size; // Start off-screen
  let speed = Math.random() * 2 + 1;
  let isDoubleScore = Math.random() < 0.1; // 10% chance to be a double score star
  let isPinkStar = Math.random() < 0.05; // 5% chance to be a pink star

  stars.push({
    x,
    y,
    width: size,
    height: size,
    speed,
    isDoubleScore,
    isPinkStar,
  });
}

function updateStars() {
  stars.forEach((star, index) => {
    star.y += star.speed * speedMultiplier;

    // Remove stars that go off the screen
    if (star.y > canvas.height) {
      stars.splice(index, 1);
    }

    // Collect star and increase score
    if (
      star.x < spaceship.x + spaceship.width &&
      star.x + star.width > spaceship.x &&
      star.y < spaceship.y + spaceship.height &&
      star.y + star.height > spaceship.y
    ) {
      if (star.isPinkStar) {
        // Activate double score power-up for 15 seconds
        doubleScoreActive = true;
        doubleScoreTimer = 15 * 60; // 15 seconds in terms of frames (60 FPS)
      } else if (star.isDoubleScore) {
        score += doubleScoreActive ? 40 : 20; // Double score star
      } else {
        score += doubleScoreActive ? 20 : 10;
      }

      scoreDisplay.innerHTML = `Score: ${score}`;
      stars.splice(index, 1);
    }
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  clearCanvas();
  drawSpaceship();
  updateSpaceship();

  if (Math.random() < 0.02) createAsteroid();
  drawAsteroids();
  updateAsteroids();

  if (Math.random() < 0.01) createStar();
  drawStars();
  updateStars();

  // Countdown for double score power-up
  if (doubleScoreActive) {
    doubleScoreTimer--;
    if (doubleScoreTimer <= 0) {
      doubleScoreActive = false;
    }
  }

  // Display the double score timer countdown if active
  if (doubleScoreActive) {
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(
      `Double Score: ${Math.ceil(doubleScoreTimer / 60)}s`,
      canvas.width - 10,
      30
    );
  }
}

function resetGame() {
  // Reset spaceship to the starting position
  spaceship.x = canvas.width / 2 - 20;
  spaceship.y = canvas.height - 60;
  spaceship.dx = 0;

  // Clear asteroids and stars
  asteroids = [];
  stars = [];

  // Reset score
  score = 0;
  scoreDisplay.innerHTML = `Score: ${score}`;
}

function startGame() {
  if (!gameActive) {
    resetGame(); // Reset game state before starting
    gameActive = true;
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
  }
}

function endGame() {
  clearInterval(gameInterval);
  gameActive = false;

  // Ask for player name
  const playerName = prompt("Game Over! Enter your name:");
  if (playerName) {
    addScore(playerName, score);
  } else {
    alert(`Your final score is ${score}`);
  }
}

// Handle swipe controls for mobile devices
let touchStartX = 0;
let touchEndX = 0;
let touchThreshold = 50; // Minimum swipe distance to trigger movement

canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  touchEndX = e.touches[0].clientX;
});

canvas.addEventListener("touchend", () => {
  const swipeDistance = touchEndX - touchStartX;

  if (swipeDistance > touchThreshold) {
    // Swipe right
    spaceship.dx = spaceship.speed;
  } else if (swipeDistance < -touchThreshold) {
    // Swipe left
    spaceship.dx = -spaceship.speed;
  }

  // Reset movement after swipe ends
  setTimeout(() => {
    spaceship.dx = 0;
  }, 100);
});

startBtn.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    spaceship.dx = -spaceship.speed;
  } else if (e.key === "ArrowRight") {
    spaceship.dx = spaceship.speed;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    spaceship.dx = 0;
  }
});

// Load high scores and spaceship image when the page is loaded
window.onload = () => {
  loadScores();
  loadSpaceshipImage();
};

function updateAsteroids() {
  asteroids.forEach((asteroid, index) => {
    asteroid.y += asteroid.speed * speedMultiplier;

    // Remove asteroids that go off the screen
    if (asteroid.y > canvas.height) {
      asteroids.splice(index, 1);
    }

    // Collision detection with spaceship
    if (
      asteroid.x < spaceship.x + spaceship.width &&
      asteroid.x + asteroid.width > spaceship.x &&
      asteroid.y < spaceship.y + spaceship.height &&
      asteroid.y + asteroid.height > spaceship.y
    ) {
      endGame();
    }
  });
}

function updateStars() {
  stars.forEach((star, index) => {
    star.y += star.speed * speedMultiplier;

    // Remove stars that go off the screen
    if (star.y > canvas.height) {
      stars.splice(index, 1);
    }

    // Collect star and increase score
    if (
      star.x < spaceship.x + spaceship.width &&
      star.x + star.width > spaceship.x &&
      star.y < spaceship.y + spaceship.height &&
      star.y + star.height > spaceship.y
    ) {
      if (star.isDoubleScore) {
        score += 20; // Double score
      } else {
        score += 10;
      }
      scoreDisplay.innerHTML = `Score: ${score}`;
      stars.splice(index, 1);
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    spaceship.dx = -spaceship.speed;
  } else if (e.key === "ArrowRight") {
    spaceship.dx = spaceship.speed;
  } else if (e.key === "ArrowDown") {
    speedMultiplier = 2; // Speed up
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    spaceship.dx = 0;
  } else if (e.key === "ArrowDown") {
    speedMultiplier = 1; // Return to normal speed
  }
});
