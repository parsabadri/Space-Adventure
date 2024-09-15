// ** Space Adventure Game Script **

// Canvas and context initialization
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const scoreDisplay = document.getElementById("score");
const scoreboard = document.getElementById("scoreboard");

canvas.width = 800;
canvas.height = 600;

// Global game state variables
let speedMultiplier = 1; // Controls game speed (1 = normal)
let doubleScoreActive = false; // Flag for double-score power-up
let doubleScoreTimer = 0; // Timer for double-score effect (in frames, 60 FPS)
let score = 0; // Player's score
let gameInterval; // Stores the game loop interval
let gameActive = false; // Tracks if the game is currently active
let highScores = []; // Stores high score entries

// Spaceship object definition
let spaceship = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  speed: 5, // Movement speed
  dx: 0, // Change in x-position
  image: null, // Image for the spaceship sprite
};

// Arrays for managing asteroids and stars
let asteroids = [];
let stars = [];

// ** Initialization Functions **

// Load spaceship image (called on page load)
function loadSpaceshipImage() {
  spaceship.image = new Image();
  spaceship.image.src = "./Assets/spaceship.svg"; // Path to spaceship image
}

// Load high scores from localStorage
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

// ** Scoreboard Management **

// Update the scoreboard UI with current high scores
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

// Add a new score to the high scores and save
function addScore(name, score) {
  highScores.push({ name, score });
  highScores.sort((a, b) => b.score - a.score); // Sort high scores in descending order
  highScores = highScores.slice(0, 5); // Keep only the top 5 scores
  saveScores();
  updateScoreboard();
}

// ** Spaceship Movement and Rendering **

// Draw spaceship on the canvas
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
    // Fallback to rectangle if image is not loaded
    ctx.fillStyle = "white";
    ctx.fillRect(spaceship.x, spaceship.y, spaceship.width, spaceship.height);
  }
}

// Update spaceship position (and ensure it stays within canvas bounds)
function updateSpaceship() {
  spaceship.x += spaceship.dx;
  // Boundary detection
  if (spaceship.x < 0) spaceship.x = 0;
  if (spaceship.x + spaceship.width > canvas.width) {
    spaceship.x = canvas.width - spaceship.width;
  }
}

// ** Asteroid Management **

// Create a new asteroid at a random position at the top of the screen
function createAsteroid() {
  const size = Math.random() * 40 + 10; // Random size between 10 and 50
  const x = Math.random() * (canvas.width - size); // Random x position
  const speed = Math.random() * 2 + 1; // Random speed
  asteroids.push({ x, y: -size, width: size, height: size, speed });
}

// Draw all asteroids on the canvas
function drawAsteroids() {
  asteroids.forEach((asteroid) => {
    ctx.fillStyle = "gray";
    ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
  });
}

// Update asteroid positions and check for collisions with spaceship
function updateAsteroids() {
  asteroids.forEach((asteroid, index) => {
    asteroid.y += asteroid.speed * speedMultiplier;

    // Remove off-screen asteroids
    if (asteroid.y > canvas.height) {
      asteroids.splice(index, 1);
    }

    // Check for collision with spaceship
    if (
      asteroid.x < spaceship.x + spaceship.width &&
      asteroid.x + asteroid.width > spaceship.x &&
      asteroid.y < spaceship.y + spaceship.height &&
      asteroid.y + asteroid.height > spaceship.y
    ) {
      endGame(); // End game on collision
    }
  });
}

// ** Star Management (Including Power-Ups) **

// Draw a star (can be a normal, double-score, or pink star)
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
    ctx.fillText("2X", cx, cy);
  }
}

// Create a star with a random type (normal, double-score, or pink)
function createStar() {
  const size = 20; // Star diameter
  const x = Math.random() * (canvas.width - size); // Random x position
  const y = -size; // Start off-screen
  const speed = Math.random() * 2 + 1; // Random speed
  const isDoubleScore = Math.random() < 0.1; // 10% chance to be a double score star
  const isPinkStar = Math.random() < 0.05; // 5% chance to be a pink star

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

// Draw all stars on the canvas
function drawStars() {
  stars.forEach((star) => {
    drawStar(
      ctx,
      star.x + star.width / 2,
      star.y + star.height / 2,
      5,
      20,
      10,
      star.isDoubleScore,
      star.isPinkStar
    );
  });
}

// Update star positions and handle collection by the spaceship
function updateStars() {
  stars.forEach((star, index) => {
    star.y += star.speed * speedMultiplier;

    // Remove stars that go off the screen
    if (star.y > canvas.height) {
      stars.splice(index, 1);
    }

    // Check for collision with spaceship (collect star)
    if (
      star.x < spaceship.x + spaceship.width &&
      star.x + star.width > spaceship.x &&
      star.y < spaceship.y + spaceship.height &&
      star.y + star.height > spaceship.y
    ) {
      if (star.isPinkStar) {
        // Activate 15-second double-score power-up
        doubleScoreActive = true;
        doubleScoreTimer = 15 * 60; // 15 seconds in frames (60 FPS)
      } else if (star.isDoubleScore) {
        score += doubleScoreActive ? 40 : 20; // Double score star
      } else {
        score += doubleScoreActive ? 20 : 10; // Normal star
      }

      scoreDisplay.innerHTML = `Score: ${score}`;
      stars.splice(index, 1); // Remove collected star
    }
  });
}

// ** Game Logic **

// Clear the canvas (for redrawing elements)
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Main game loop (called every frame)
function gameLoop() {
  clearCanvas();
  drawSpaceship();
  updateSpaceship();

  // Create and update asteroids
  if (Math.random() < 0.02) createAsteroid();
  drawAsteroids();
  updateAsteroids();

  // Create and update stars
  if (Math.random() < 0.01) createStar();
  drawStars();
  updateStars();

  // Handle double-score power-up timer
  if (doubleScoreActive) {
    doubleScoreTimer--;
    if (doubleScoreTimer <= 0) {
      doubleScoreActive = false; // Disable power-up when timer runs out
    }
  }

  // Display double score timer if active
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

// Reset game to its initial state
function resetGame() {
  // Reset spaceship position and movement
  spaceship.x = canvas.width / 2 - 20;
  spaceship.y = canvas.height - 60;
  spaceship.dx = 0;

  // Clear asteroids and stars
  asteroids = [];
  stars = [];

  // Reset score and update UI
  score = 0;
  scoreDisplay.innerHTML = `Score: ${score}`;
}

// Start the game
function startGame() {
  if (!gameActive) {
    resetGame();
    gameActive = true;
    gameInterval = setInterval(gameLoop, 1000 / 60); // Start game loop at 60 FPS
  }
}

// End the game, prompt for player's name, and update high scores
function endGame() {
  clearInterval(gameInterval);
  gameActive = false;

  // Prompt for player name
  const playerName = prompt("Game Over! Enter your name:");
  if (playerName) {
    addScore(playerName, score); // Add score to leaderboard
  } else {
    alert(`Your final score is ${score}`);
  }
}

// ** Mobile Controls (Swipe)**

// Track touch events for swipe control on mobile
let touchStartX = 0;
let touchEndX = 0;
let touchThreshold = 50; // Minimum swipe distance for movement

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

  // Stop movement after swipe ends
  setTimeout(() => {
    spaceship.dx = 0;
  }, 100);
});

// ** Keyboard Controls **

// Handle keyboard input for moving spaceship (left, right, and speed boost)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    spaceship.dx = -spaceship.speed;
  } else if (e.key === "ArrowRight") {
    spaceship.dx = spaceship.speed;
  } else if (e.key === "ArrowDown") {
    speedMultiplier = 2; // Increase game speed
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    spaceship.dx = 0; // Stop movement
  } else if (e.key === "ArrowDown") {
    speedMultiplier = 1; // Return to normal speed
  }
});

// ** Game Start and Initialization **

// Start the game when the start button is clicked
startBtn.addEventListener("click", startGame);

// Load high scores and spaceship image when the page is fully loaded
window.onload = () => {
  loadScores();
  loadSpaceshipImage();
};
