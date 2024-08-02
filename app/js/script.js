var faces_all = [];
var faces_working = [];
var nicknames;
var playerName = "";
var score = 0; // Current score: +1 for first name, +2 for first & last
var wrong = 0; // Number of wrong answers
var skips = 0; // Number of faces skipped
var answer = ""; // Name of current person in readable format
var gameOver = false; // Has player gone through all available faces?
const timer = document.getElementById("Timer");
var gameLength = 10; // Time in seconds each round lasts
var gameTimer;
var blinker; // Makes high score blink on leaderboard
var confetti = false; // Has the confetti been animated already?
var ding1 = new Audio("/assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav");
var ding2 = new Audio("/assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav");
var newHighScoreSFX = new Audio("/assets/ESM_Positive_Correct_Bling_v3_Sound_FX_Arcade_Casino_Kids_Mobile_App.wav");
var newRecordSFX = new Audio("/assets/ESM_Casino_Win_Pattern_8_Sound_FX_Arcade_Kids_Mobile_App.wav");
ding1.volume = 0.7;
ding2.volume = 0.7;
newHighScoreSFX.volume = 0.8;
document.getElementById("submit").disabled = true;

// Set focus to the input field when the page loads
window.onload = () => {
    document.getElementById("playername").focus();
};

function setName(form) {
    playerName = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim(); // Set player name, remove special characters
    gameInit();
}

// Get faces from server
fetch('app/data.php?' + new URLSearchParams({set: 'all'}), {
    method: 'GET',
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response not ok');
        }
        return response.json();
    })
    .then(data => {
        faces_all = data;
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });

// Get list of nicknames
fetch("nicknames.json")
    .then(response => {
        return response.text();
    })
    .then(text => {
        nicknames = JSON.parse(text);
    })
    .catch(error => {
        console.error('Fetch error:', error);
    })

// Initialize game with specified time limit, reset score, start with first face 
function gameInit() {
    clearInterval(gameTimer);
    startTimer(gameLength);
    document.getElementById("howToPlay").style.display = "none"; // Hide popup window
    document.getElementById("submit").disabled = false;
    document.getElementById("skip").disabled = false;
    document.getElementById("textinput").disabled = false;
    document.getElementById("textinput").value = "";
    document.getElementById("gameoverWindow").style.display = "none";
    document.getElementById("gameoverWindow").innerHTML = "";
    document.getElementById("confettiCanvas").style.display = "none";
    faces_working = faces_all;
    gameOver = false;
    score = 0;
    wrong = 0;
    document.getElementById("score").innerText = score;
    loadNewFace();
    document.getElementById("textinput").focus();
    // If playerName !== "Daniel", play Jeopardy music
}

// Choose a random person from the working set and load the image into the image container
function loadNewFace() {
    // If working faces array is empty, end the game.
    if (Object.keys(faces_working).length === 0) {
        gameOver = true;
        gameEnd();
        return;
    }

    // Randomly choose face from working faces array
    var keys = Object.keys(faces_working);
    var randomIndex = Math.floor(Math.random() * keys.length); 
    var randomFace = keys[randomIndex];

    answer = randomFace.replace(/_/g, " ");

    // Choose a random img in folder (if more than one) and set img src
    var randomImg = Math.floor(Math.random() * faces_working[randomFace].length);
    var path = faces_working[randomFace][randomImg];
    //document.getElementById("image").src = path;
    document.getElementById("imageElement").style.backgroundImage = 'url("'+path+'")';
    delete faces_working[randomFace]; // Remove face so it's not repeated
}

// Start a countdown timer for game
function startTimer(seconds) {
    var timeRemaining = seconds;
    
    // Start first second of timer
    updateTimer(timeRemaining);
    timeRemaining -= 1;

    gameTimer = setInterval(function() {
        if (timeRemaining <= 0 || gameOver) {
            clearInterval(gameTimer);
            gameEnd();
            timer.innerHTML = "00:00";
            return;
        }
        updateTimer(timeRemaining);
        timeRemaining -= 1;
    }, 1000);
}

// Update the timer element in html with leading zeros.
function updateTimer(timeRemaining) {
    var minutes = Math.floor(timeRemaining / 60);
        var remainingSeconds = timeRemaining % 60;
        
        // Add leading zero to seconds and minutes
        var formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
        var formattedSeconds = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
        formattedMinutes + ":" + formattedSeconds;
        
        timer.innerHTML = formattedMinutes + ":" + formattedSeconds;
}

// Check if user's input is correct or not
function checkAnswer(form) {
    var input = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim().split(" "); // Remove special characters, converter to lower
    var correct = answer.toLowerCase().replace(/'/g, "").split(" ");

    var nicknameKeys = Object.keys(nicknames);

    // Check if first name matches, if yes then check last name in input if there is one
    if (input[0] === correct[0] || (nicknameKeys.includes(answer) && nicknames[answer] === input[0])) {
        score++;

        // Play correct "ding" sfx
        ding1.play();
        flashGreen();

        // Show "correct" text
        if (input.length > 1 && input[1] === correct[1]) {
            score++;
            setTimeout(function() {
                ding2.play();}, 130);
        } 
    } else {
        wrong++;
    }

    // Update the score
    var scoreCard = document.getElementById("score");
    scoreCard.innerText = score;

    // Flash the correct answer over the image
    var overlay = document.getElementById("nameOverlay");
    overlay.innerHTML = answer;
    overlay.style.opacity = "1";
    setTimeout(function() {
        overlay.style.opacity = "0";
    }, 600);

    document.getElementById("textinput").value = ""; // Reset input box
    loadNewFace();
}

// Flash the score text green for .3 seconds
function flashGreen() {
    var score = document.getElementById("score");
    score.classList.add("green");

    setTimeout(function() {
        score.classList.remove("green");
    }, 300);
}

// Handle end of game, lock input, show leaderboard
function gameEnd() {
    document.getElementById("submit").disabled = true;
    document.getElementById("skip").disabled = true;
    document.getElementById("textinput").disabled = true;

    // Send name-score pair to server, returns updated leaderboard
    fetch('app/updateScores.php', {
        method: 'POST',
        body: JSON.stringify({name: playerName, score: score, timestamp: Date.now()})
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        // Display top 10 score leaderboard
        clearInterval(blinker);
        var leaderboardTable = document.getElementById("leaderboard");
        var sortedScores = data;
        var index = 0;

        console.log(Date.now());


        for (var i = 0, row; row = leaderboardTable.rows[i]; i++) {
            var ending = "th";
            if (i === 0) {
                ending = "st"; 
            } else if (i === 1) {
                ending = "nd";
            } else if (i === 2) {
                ending = "rd";
            }
            row.cells[0].textContent = i + 1 + ending.toUpperCase();
            row.cells[1].textContent = data[i].name.toUpperCase();
            row.cells[2].textContent = data[i].score;

            // If player score is top ten and new, highlight & blink
            if (sortedScores[index].score == score && data[i].name == playerName && (Date.now() - data[i].timestamp < 3)) {
                row.style.color = "white";

                // Make score blink for 15 seconds
                var text = row;
                blinker = setInterval(function() {
                    text.style.opacity = (text.style.opacity == '0' ? '1' : '0');
                }, 400);
                setTimeout(function() {
                    clearInterval(blinker);
                    text.style.opacity = "1";
                  }, 15000);

                // If new top score, play confetti and sfx
                if (i === 0) {
                    newRecordSFX.play();
                    document.getElementById("confettiCanvas").style.display = "block";
                    if (!confetti) { animate(); } // Play confetti visual effect
                } else {
                    newHighScoreSFX.play();
                }
            } else {
                row.style.color = "black";
            }
            index++;
        }

    })
    .catch(error => {
        console.error('Fetch error:', error);
    })

    document.getElementById("gameoverWindow").style.display = "block"; // Show popup window
}

// Register enter key as a click on submit button
document.getElementById("enterName").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      document.getElementById("submitName").click(); // Simulate a click on the submit button
    }
  });

// Register enter key as a click on submit button
document.getElementById("quizForm").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      document.getElementById("submit").click(); // Simulate a click on the submit button
    }
  });

// Block right-clicks to prevent cheating
document.getElementById("imageElement").addEventListener('contextmenu', function(event) {
    event.preventDefault();
  });