import { showElement, hideElement, resetGameUI, showNewUserPopup } from './ui.js?=ver1.2';
import { fetchScores, getSkips, getWrong, resetCounters, incrementSkips, incrementWrong } from './scoreboard.js?=ver2.1';

(function () {
    let faces_all = [];
    let faces_working = []; // faces removed after shown
    let playerName; // i.e. talldan
    let userId; // i.e. 89
    let currentFace = ""; // name of current person

    let gameOver = false; // track status of game round
    let gameTimer;
    let gameModeId;
    let gameModeTitle;

    let rng; // global PRNG
    let seed; // store seed so players can share it
    let isSeedSet = false; // has user set the seed or is it random?

    const timer = document.getElementById("Timer");
    let gameLength = 60; // time in seconds each round lasts

    let debugEnabled;

    // Debug mode
    if (debugEnabled) { 
        // gameLength = 5;
        // Pause function
    }

    // Set the player's name, start showing online activity status
    function setName(form) {
        document.getElementById('howToPlay').style.display = 'none';
        playerName = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim(); // Set player name, remove special characters
        fetch('server/login.php?' + new URLSearchParams({username:playerName}), {
            method: 'GET',
        })
            .then(response => response.json())
            .then(data => {
                if (data && data !== 0) { // Existing user, login normally
                    userId = data;
                    loadModes();
                    sendUsername(playerName, userId); // Send user info to ws
                    showElement('mainMenu');    
                    if (playerName == "talldan") { debugEnabled = true; } else { debugEnabled = false; }
                } else { // New user, need to get first and last name
                    addNewUser();
                }             
            })
    }

    // Prompt user for first and last name, write to db
    function addNewUser() {
        showNewUserPopup(playerName, (username, firstName, lastName, codeword) => {
            fetch('server/newUser.php?', {
                method: 'POST',
                body: JSON.stringify({ username, firstName, lastName, codeword })
            })
            .then(response => response.json())
            .then(data => {
                userId = data;
                loadModes();
                sendUsername(playerName, userId); // Send user info to ws to login
                showElement('mainMenu');
            });
        });
    }

    function resetGameMode() {
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('gameoverWindow').style.display = 'none';
        document.getElementById("confettiCanvas").style.display = 'none';
        document.getElementById("combinedLeaderboardWindow").style.display = "none";
        document.getElementById("QuizContainer").style.filter = "blur(4px)";
        resetCounters();
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
    function loadModes() {
        fetch('server/modes.php', {
            method: 'POST',
                body: JSON.stringify({ userId })
        })
            .then(response => response.json())
            .then(data => {
                const modeList = document.getElementById('gameModeButtons');
                modeList.innerHTML = ""; // Clear old buttons
                const entries = Object.entries(data); // Convert object -> array of [key, value] pairs
                const sortedModes = entries.sort((a, b) => a[1].display_name.localeCompare(b[1].display_name)); // Sort alphabetically
                sortedModes.forEach(([gameMode, details], index) => {
                const listItem = document.createElement('button');
                listItem.textContent = details.display_name;
                listItem.addEventListener('click', (function(selectedMode) {
                    return function() {
                        updateTimer(gameLength);
                        gameModeId = selectedMode;
                        gameModeTitle = data[selectedMode]['display_name'];
                        console.log('Selected Game Mode: ' + gameModeTitle);
                        getFaceData(details.year, details.tags, details.role);
                    };
                })(gameMode));
                modeList.appendChild(listItem);

                // Focus the first one after building the list
                if (index === 0) {
                    listItem.focus();
                }
            });
            })
    }

    // Retrieve set of faces dictionary from server, faces mapped to array of img filepaths.
    function getFaceData(gameModeYear, gameModeTag, gameModeRole) {
        fetch('server/data.php?' + new URLSearchParams({year:gameModeYear, tag:gameModeTag, role:gameModeRole}), {
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
                gameInit();
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }

    // Start caching images as soon as game mode selected
    function preLoadImages() {
        Object.entries(faces_all).forEach(([name, data]) => {
            data.images.forEach((image) => {
                const img = new Image();
                img.src = image;
                // console.log(image + " cached\n");
            });
        });
    }

    // Initialize game with specified time limit, reset score, start countdown and load first face 
    function gameInit() {
        scoreManager.resetScore();
        clearInterval(gameTimer);
        document.getElementById("howToPlay").style.display = "none"; // Hide popup window
        document.getElementById("textinput").value = "";
        document.getElementById("gameoverWindow").style.display = "none";
        document.getElementById("confettiCanvas").style.display = "none";
        document.getElementById("QuizContainer").style.filter = "none"; // Remove blur from quiz container
        faces_working = JSON.parse(JSON.stringify(faces_all));
        gameOver = false;
        resetCounters();
        document.getElementById("score").innerText = scoreManager.getScore();
        document.getElementById("textinput").disabled = false;
        document.getElementById("submit").disabled = true;
        document.getElementById("skip").disabled = true;
        document.getElementById("textinput").focus();

        // Blur first image during countdown
        const imgDiv = document.getElementById("imageElement");
        imgDiv.style.filter = "blur(26px)";
        initRNG();
        loadNewFace(rng);
        document.getElementById('mainMenu').style.display = 'none'; // Hide main menu

        // Start countdown to game start
        let tMinus = 2;
        var countdownText = document.getElementById("countDown");
        countdownText.innerHTML = "3";
        preLoadImages();
        countDownSFX.play();
        
        const countDown = setInterval(function(){
            if (tMinus <= 0) {
                countdownText.innerHTML = "";
                imgDiv.style.filter = "none"; // Unblur first image when game start
                document.getElementById("submit").disabled = false;
                document.getElementById("skip").disabled = false;
                startTimer(gameLength); // Start timer
                clearInterval(countDown);
            } else {
                countdownText.innerHTML = tMinus;
                tMinus--;
            }
        }, 1000);
    }

    // Choose a random person from the working set and load the image into the image container
    function loadNewFace(rng) {
        // If working faces array is empty, recycle the set.
        if (Object.keys(faces_working).length === 0) {
            faces_working = JSON.parse(JSON.stringify(faces_all));
        }

        // Randomly choose face from working faces array
        var keys = Object.keys(faces_working);

        // var randomIndex = Math.floor(Math.random() * keys.length); 
        // currentFace = keys[randomIndex];

        // // Choose a random img in folder (if more than one) and set img src
        // var randomImg = Math.floor(Math.random() * faces_working[currentFace].images.length);

        var randomIndex = Math.floor(rng() * keys.length); 
        currentFace = keys[randomIndex];
        var randomImg = Math.floor(rng() * faces_working[currentFace].images.length);

        var path = faces_working[currentFace].images[randomImg];
        document.getElementById("imageElement").style.backgroundImage = 'url("'+path+'")';

        delete faces_working[currentFace]; // Remove face from working array so it's not repeated
    }

    function initRNG() {
        const seedInput = document.getElementById("seedInput").value.trim();

        if (seedInput) {
            // Use typed seed
            let seedGen = xmur3(seedInput);
            seed = seedGen();
            isSeedSet = true;
        } else {
            // Generate random default seed
            seed = Math.floor(Math.random() * 2**32);
            isSeedSet = false;
        }

        rng = mulberry32(seed);
        console.log("Game started with seed:", seed);
    }

    function xmur3(str) {
        for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        return function() {
            h = Math.imul(h ^ h >>> 16, 2246822507);
            h = Math.imul(h ^ h >>> 13, 3266489909);
            return (h ^= h >>> 16) >>> 0;
        }
    }

    function mulberry32(seed) {
        return function() {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
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
        let input = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim().split(" "); // Remove special characters, converter to lower
        let inputFull = input.join(" ");
        let inputFirst = input.slice(0, -1).join(" ") || input[0]; // everything except last word, or just first word if only one
        let inputLast = input.length > 1 ? input[input.length - 1] : "";
        let correctAnswer = currentFace.toLowerCase().replace(/'/g, "").split("_"); // ["sue ann", "park"]
        let correctFirst = correctAnswer.slice(0, -1).join(" ");
        let correctLast = correctAnswer[correctAnswer.length - 1];

        var pointAdded = false;

        if (input[0].length == 0) {
            incrementSkips();
        } else if ( // Check if input matches name or nickname
            inputFirst === correctFirst || 
            inputFull === correctFirst ||
            faces_all[currentFace].nicknames.includes(inputFirst) ||
            faces_all[currentFace].nicknames.includes(inputFull) // check entire input against nicknames
        ) {
            scoreManager.incrementScore();
            pointAdded = true; 
            
            // Play correct "ding" sfx
            ding1.play();
            flashGreen();
        }

        // Check last name
        if (inputLast && inputLast === correctLast ||
            inputFull === correctLast
            // || faces_all[currentFace].acceptedLastNames.includes(inputLast) // check alternate last names
        ) {
            scoreManager.incrementScore(); 
            pointAdded = true; 

            // Extra point for last names with hyphen
            if (correctAnswer[1].includes('-')) {
                scoreManager.incrementScore(); 
            }
            setTimeout(() => ding2.play(), 130);
        } 

        if (input && pointAdded == false) {incrementWrong()}

        console.log("Answer: " + correctAnswer);
        if (faces_all[currentFace].nicknames) {
        console.log("Accepted First Names: " + faces_all[currentFace].nicknames); }
        console.log("Entered: " + input  + " (Running score: " + scoreManager.getScore() + ")");

        // Update the score
        var scoreCard = document.getElementById("score");
        scoreCard.innerText = scoreManager.getScore();

        // Flash the correct answer over the image
        var overlay = document.getElementById("nameOverlay");
        var displayAnswer = currentFace.split("_");
        overlay.innerHTML = displayAnswer[0] + " " + displayAnswer[1];
        overlay.style.opacity = "1";
        setTimeout(function() {
            overlay.style.opacity = "0";
        }, 600);

        document.getElementById("textinput").value = ""; // Reset input box
        console.log("Loading new face...");
        loadNewFace(rng);
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
        console.log("Skipped");
        incrementSkips();
        loadNewFace(rng);
    }

    // Handle end of game, lock input, show leaderboard
    function gameEnd() {
        document.getElementById("submit").disabled = true;
        document.getElementById("skip").disabled = true;
        document.getElementById("textinput").disabled = true;
        document.getElementById("finalScore").innerText = scoreManager.getScore();
        gameOver = true;
        console.log("Skips: " + getSkips());
        console.log("Errors: " + getWrong());
        toggleLeaderboard();
        //(userId, scoreManager.getScore(), gameModeId, false, true);
    }

    function toggleCombinedLeaderboard() {
        document.getElementById("gameoverWindow").style.display = "none";
        if (document.getElementById("combinedLeaderboardWindow").checkVisibility()) {
            document.getElementById("combinedLeaderboardWindow").style.display = "none";
        } else {
            fetchScores(userId, null, null, null, true, gameOver);
        }
    }

    function toggleLeaderboard() {
        document.getElementById("combinedLeaderboardWindow").style.display = "none";
        if (document.getElementById("gameoverWindow").checkVisibility()) {
            document.getElementById("gameoverWindow").style.display = "none";
        } else {
            // Only send score if seed wasn't set. Setting seed disqualifies score from leaderboard
            let sendScore;
            if (isSeedSet) { sendScore = 0; } else { sendScore = scoreManager.getScore() }
            fetchScores(userId, sendScore, gameModeId, gameModeTitle, false, true);
        }
    }

    function setGameMode(modeId) {
        gameModeId = modeId;
    }

    window.interface =  {
        setName: setName,
        gameInit: gameInit,
        preventInvalidInput: preventInvalidInput,
        toggleLeaderboard: toggleLeaderboard,
        toggleCombinedLeaderboard: toggleCombinedLeaderboard,
        loadNewFace: loadNewFace,
        checkAnswer: checkAnswer,
        skipFace: skipFace,
        setGamemode: setGameMode,
        resetGameMode: resetGameMode
    }
})();
