const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 1.2;
canvas.height = window.innerHeight * 1.2;
let animationID;

const confettiColors = ['#f44336', '#ffeb3b', '#2196f3', '#4caf50', '#9c27b0', '#ff9800'];

function Confetti() {
  this.x = Math.random() * canvas.width;
  this.y = -10;
  this.r = Math.random() * 2 + 2; // Range of confetti size
  this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  this.velocityX = Math.random() * 4 - 2;
  this.velocityY = Math.random() * 3 + 1;

  this.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  this.update = function() {
    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.y + this.r > canvas.height) {
      this.y = -10;
      this.x = Math.random() * canvas.width;
    }

    this.draw();
  }
}

const confettis = [];
for (let i = 0; i < 100; i++) {
  confettis.push(new Confetti());
}

function animate() {
    //canvas.style.display = "block";
    animationID = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let confetti of confettis) {
        confetti.update();
    }
}