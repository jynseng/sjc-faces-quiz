var faces_all = [];
var faces_working = [];
var score = 0; // Current score: +1 for first name, +2 for first & last
var answer = ""; // Name of current person
var gameOver = false; // Has player gone through all available faces?

document.getElementById("replay").style.display = "none";
document.getElementById("submit").disabled = true;

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
    .then(data => {
        faces_all = data;
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });

var nicknamesPath = "nicknames.txt";

// Initialize game with specified time limit, reset score, start with first face 
function gameInit() {
    document.getElementById("Popup").style.display = "none"; // Hide popup window
    document.getElementById("submit").disabled = false;
    document.getElementById("textinput").value = "";
    document.getElementById("replay").style.display = "none";
    faces_working = faces_all;
    gameOver = false;
    score = 0;
    document.getElementById("score").innerText = score;
    loadNewFace();
    startTimer(60);
}

// Show popup window on page load to set preferences and start game.
function setUp() {
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
    console.log(answer);

    // Choose a random img in folder (if more than one) and set img src
    var randomImg = Math.floor(Math.random() * faces_working[randomFace].length);
    var path = faces_working[randomFace][randomImg];
    document.getElementById("image").src = path;
    
    delete faces_working[randomFace]; // Remove face so it's not repeated
}

// Start a countdown timer for game
function startTimer(seconds) {
    var timer = document.getElementById("Timer");
    var timeRemaining = seconds;

    var gameTimer = setInterval(function() {
        timer.innerHTML = "00:"+timeRemaining;
        timeRemaining -= 1;
        if (timeRemaining <= 0 || gameOver) {
            clearInterval(gameTimer);
            timer.innerHTML = "00:00";
            gameEnd();
            return;
        }
    }, 1000);
}

// Check if user's input is correct or not
function checkAnswer(form) {
    //"clean" input of case, minor spelling errors
    //Display "correct"/"incorrect" text

    var input = form.inputbox.value.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().trim().split(" "); // Remove special characters, converter to lower
    var correct = answer.toLowerCase().replace(/'/g, "").split(" ");

    // Check if first name matches, if yes then check second name if there is one
    // Scan the nicknames.txt file, check if the name is there, then load the nickname
    altName = "";

    if (input[0] === correct[0] || input[0] === altName) {
        score++;
        console.log("First name correct!");
        // Show "correct" text
        if (input.length > 1 && input[1] === correct[1]) {
            score++;
            console.log("Second name correct!");
        } 
        // Play correct "ding" sfx
        var ding = document.getElementById("dingSFX");
        ding.play();
    } else {
        console.log("Incorrect :(");
    }

    var scoreCard = document.getElementById("score");
    scoreCard.innerText = score;

    document.getElementById("textinput").value = ""; // Reset input box
    loadNewFace();
}

// Handle end of game, lock input, show leaderboard
function gameEnd() {
    document.getElementById("submit").disabled = true;
    document.getElementById("skip").disabled = true;
    document.getElementById("replay").style.display = "block";
}

document.getElementById("quizForm").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      document.getElementById("submit").click(); // Simulate a click on the submit button
    }
});