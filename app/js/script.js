var faces_all = [];
var faces_working = [];

document.addEventListener("DOMContentLoaded", gameInit);

fetch('app/data.php?' + new URLSearchParams({set: 'all'}), {
    method: 'GET',
    //headers: {'Content-Type': 'application/json',},
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response not ok');
        }
        return response.json();
    })
    .then(data => (faces_working = data))
    .catch(error => {
        console.error('Fetch error:', error);
    });

function gameInit() {
    faces_working = faces_all;
    loadNewFace();
    startTimer(60);
}

// Choose a random person from the working set and load the image into the image container
function loadNewFace() {
    // If working faces array is empty, end game and cancel timer.
    
    // Randomly choose face from working faces array
    var randomIndex = Math.floor(Math.random() * faces_working.length); 
    var randomFace = faces_working[randomIndex];

    // Choose random img in folder and set img src
    var path = "";
    
    // Create new img element and add to html
    var newImg = document.createElement("img");
    newImg.src = path;
    newImg.setAttribute("unselectable", "on");
    var container = document.getElementById("ImageContainer");
    container.appendChild(newImg);
    
    delete faces_working[randomIndex]; // Remove face so it's not repeated
}

// Start a countdown timer for game
function startTimer(seconds) {
    var timer = document.getElementById("Timer");
    var timeRemaining = seconds;

    var gameTimer = setInterval(function() {
        timer.innerHTML = "00:"+timeRemaining;
        timeRemaining -= 1;
        if (timeRemaining <= 0) {
            clearInterval(gameTimer);
            timer.innerHTML = "00:00";
            gameEnd();
        }
    }, 1000);
}

// Check if user's input is correct or not
function checkAnswer() {
    //"clean" input of case, minor spelling errors
    //Add to score if correct
    //Display "correct"/"incorrect" text
    loadNewFace();
}

// Handles the end of game
function gameEnd() {
    // Show score, leaderboard
    // Show restart button
}