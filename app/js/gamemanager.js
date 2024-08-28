(function () {
    var faces_all = [];
    var faces_working = [];
    var nicknames;
    var playerName = "";
    var wrong = 0; // Number of wrong answers
    var skips = 0; // Number of faces skipped
    var answer = ""; // Name of current person in readable format
    var gameOver = false; // Has player gone through all available faces?
    const timer = document.getElementById("Timer");
    const gameLength = 60; // Time in seconds each round lasts
    var currentTime;
    var gameTimer;
    var gameModeId;
    var gameModeYear;
    var gameModeTag;
    var blinker; // Makes high score blink on leaderboard
    var confetti = false; // Has the confetti been animated already?
    var ding1 = new Audio("assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav");
    var ding2 = new Audio("assets/ESM_Correct_Answer_Bling_3_Sound_FX_Arcade_Casino_Kids_Mobile_App_Positive_Achievement_Win.wav");
    var newHighScoreSFX = new Audio("assets/ESM_Positive_Correct_Bling_v3_Sound_FX_Arcade_Casino_Kids_Mobile_App.wav");
    var newRecordSFX = new Audio("assets/ESM_Casino_Win_Pattern_8_Sound_FX_Arcade_Kids_Mobile_App.wav");
    ding1.volume = 0.7;
    ding2.volume = 0.7;
    newHighScoreSFX.volume = 0.8;
    document.getElementById("submit").disabled = true;

    // Set focus to the input field when the page loads
    window.onload = () => {
        document.getElementById("playername").focus();
        if (!document.getElementById('playername').value.trim()) {
            document.getElementById('submitName').disabled = true;
        }
    };

    function setName(form) {
        playerName = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim(); // Set player name, remove special characters
        gameInit();
    }

    // Set, increment, and track player score. Encapsulated to prevent tampering.
    const scoreManager = (function() {
        let score = 0; // Private variable

        // Function to get the current score
        function getScore() {
            return score;
        }

        // Function to increment the score
        function incrementScore() {
            score += 1;
            return score;
        }

        function resetScore() {
            score = 0;
            return score;
        }

        // Expose the functions that interact with score
        return {
            getScore: getScore,
            incrementScore: incrementScore,
            resetScore: resetScore
        };
    })();

    // Get gamemode info
    fetch('server/modes.php')
        .then(response => response.json())
        .then(data => {
            const modeList = document.getElementById('gameModeButtons');
            for (var gameMode in data) {
                const listItem = document.createElement('button');
                listItem.textContent = data[gameMode]['display_name'];
                listItem.addEventListener('click', (function(selectedMode) {
                    return function() {
                        // Set the game mode
                        gameModeId = selectedMode;
                        gameModeYear = data[gameMode]['year'];
                        gameModeTag = data[gameMode]['tags'];
                        console.log('Selected Game Mode: ' + data[gameMode]['display_name']);
                        getFaceData();

                        // Hide the window, unhide how to play window
                        document.getElementById('gameModes').style.display = 'none';
                        document.getElementById('howToPlay').style.display = 'block';
                    };
                })(gameMode));
                modeList.appendChild(listItem);
            }
        })

    // Retrieve set of faces dictionary from server, faces mapped to array of img filepaths.
    function getFaceData() {
        fetch('server/data.php?' + new URLSearchParams({year:gameModeYear ?? 'all', set:gameModeTag ?? 'all'}), {
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
    }

    // Get list of nicknames
    fetch('server/nicknames.json')
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
        scoreManager.resetScore();
        document.getElementById("howToPlay").style.display = "none"; // Hide popup window
        document.getElementById("submit").disabled = false;
        document.getElementById("skip").disabled = false;
        document.getElementById("textinput").disabled = false;
        document.getElementById("textinput").value = "";
        document.getElementById("gameoverWindow").style.display = "none";
        document.getElementById("confettiCanvas").style.display = "none";
        faces_working = JSON.parse(JSON.stringify(faces_all));
        gameOver = false;
        wrong = 0;
        skips = 0;
        document.getElementById("score").innerText = scoreManager.getScore();
        loadNewFace();
        document.getElementById("textinput").focus();
    }

    // Choose a random person from the working set and load the image into the image container
    function loadNewFace() {
        // If working faces array is empty, recycle the set.
        if (Object.keys(faces_working).length === 0) {
            faces_working = JSON.parse(JSON.stringify(faces_all));
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

        if (input[0].length == 0) {
            skips++;
        } else if (input[0] === correct[0] || (nicknameKeys.includes(answer) && nicknames[answer] === input[0])) {
            scoreManager.incrementScore(); 
            
            // Play correct "ding" sfx
            ding1.play();
            flashGreen();

            // Check last name
            if (input.length > 1 && input[1] === correct[1]) {
                scoreManager.incrementScore(); 

                // Extra point for last names with hyphen
                if (correct[1].includes('-')) {
                    scoreManager.incrementScore(); 
                }
                setTimeout(function() {
                    ding2.play();}, 130);
            } 
        } else {
            wrong++;
        }

        console.log("Answer: " + correct);
        console.log("Entered: " + input  + " (Running score: " + scoreManager.getScore() + ")");

        // Update the score
        var scoreCard = document.getElementById("score");
        scoreCard.innerText = scoreManager.getScore();

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
        var scoreCard = document.getElementById("score");
        scoreCard.classList.add("green");

        setTimeout(function() {
            scoreCard.classList.remove("green");
        }, 300);
    }

    // Called when "skip" button is clicked
    function skipFace() {
        skips++;
        loadNewFace();
    }

    // Handle end of game, lock input, show leaderboard
    function gameEnd() {
        document.getElementById("submit").disabled = true;
        document.getElementById("skip").disabled = true;
        document.getElementById("textinput").disabled = true;
        document.getElementById("finalScore").innerText = scoreManager.getScore();
        gameOver = true;
        console.log("Skips: " + skips);
        console.log("Errors: " + wrong);
        fetchScores();
    }

    function toggleLeaderboard() {
        if (document.getElementById("gameoverWindow").checkVisibility()) {
            document.getElementById("gameoverWindow").style.display = "none";
        } else {
            fetchScores();
        }
    }

    function fetchScores() {
        currentTime = Date.now();
        // Send name-score pair to server, returns updated leaderboard
        fetch('server/updateScores.php', {
            method: 'POST',
            body: JSON.stringify({status: gameOver, name: playerName, score: scoreManager.getScore(), timestamp: currentTime}),
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Display top 10 score leaderboard
            clearInterval(blinker);
            var leaderboardTable = document.getElementById("leaderboard");
            leaderboardTable.innerHTML = "";
            var sortedScores = data;
            var index = 0;

            document.getElementById("gameoverWindow").style.display = "block"; // Show popup window

            for (var i = 0; i<25; i++) {
                if (!data[i]) {
                return; 
                }

                var ending = "th";
                if (i === 0 || i === 20) {
                    ending = "st"; 
                } else if (i === 1 || i === 21) {
                    ending = "nd";
                } else if (i === 2 || i === 22) {
                    ending = "rd";
                }

                // Create new row with three cells and append to table
                const row = document.createElement('tr');
                
                const cell1 = document.createElement('td');
                cell1.textContent = i + 1 + ending.toUpperCase();
                row.appendChild(cell1);

                const cell2 = document.createElement('td');
                cell2.textContent = data[i].name.toUpperCase();
                row.appendChild(cell2);

                const cell3 = document.createElement('td');
                cell3.textContent = data[i].score;
                row.appendChild(cell3);
                
                leaderboardTable.appendChild(row);

                // If player score is top ten and new, highlight & blink 
                if (sortedScores[index].score == scoreManager.getScore() && data[i].name == playerName && data[i].timestamp == currentTime) {
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
                        alert("Congrats on setting the new high score!\nYou are SO SMART and SO CAPABLE.\nYOU ARE BRAT");
                    } else {
                        newHighScoreSFX.play();
                    }
                } else {
                    row.style.color = "black";
                }
                index++;
            }
            scoreManager.resetScore();
        })
        .catch(error => {
            console.error('Fetch error:', error);
        })
    }

    function setGameMode(modeId) {
        gameModeId = modeId;
    }

    window.interface =  {
        setName: setName,
        gameInit: gameInit,
        preventInvalidInput: preventInvalidInput,
        toggleLeaderboard: toggleLeaderboard,
        loadNewFace: loadNewFace,
        checkAnswer: checkAnswer,
        skipFace: skipFace,
        setGamemode: setGameMode
    }
})();
