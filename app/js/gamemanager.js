(function () {
    let faces_all = [];
    let faces_working = [];
    let playerName;
    let userId;
    let wrong = 0; // Number of wrong answers
    let skips = 0; // Number of faces skipped
    let currentFace = ""; // Name of current person
    let gameOver = false;
    let gameTimer;
    let gameModeId;
    let gameModeTitle;
    let blinker; // Makes high score blink on leaderboard
    let confetti = false; // Has the confetti been animated already?

    const timer = document.getElementById("Timer");
    const gameLength = 60; // Time in seconds each round lasts

    // Set the player's name, start showing online activity status
    function setName(form) {
        document.getElementById('howToPlay').style.display = 'none';
        playerName = form.inputbox.value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim(); // Set player name, remove special characters
        fetch('server/login.php?' + new URLSearchParams({username:playerName}), {
            method: 'GET',
        })
            .then(response => response.json())
            .then(data => {
                if (data) { // Existing user, login normally
                    userId = data;
                    loadModes();
                    fetchActiveUsers(playerName, 'true');
                    startActivity();
                    document.getElementById('mainMenu').style.display = 'block';    
                } else { // New user, need to get first and last name
                    addNewUser();
                }             
            })
    }

    // Prompt user for first and last name, write to db
    function addNewUser() {
        const popupDiv = document.createElement('div');
        popupDiv.className = 'popup';

        const header = document.createElement('h3');
        header.innerHTML = 'Enter name';

        const newForm = document.createElement('form');
        newForm.setAttribute('id', 'userFirstLast');

        const firstNameInput = document.createElement('input');
        firstNameInput.setAttribute('type', 'text');
        firstNameInput.setAttribute('placeholder', 'First Name');
        firstNameInput.setAttribute('id', 'first-name');
        firstNameInput.setAttribute('maxlength', '20');
        firstNameInput.required = true;

        const lastNameInput = document.createElement('input');
        lastNameInput.setAttribute('type', 'text');
        lastNameInput.setAttribute('placeholder', 'Last Name');
        lastNameInput.setAttribute('id', 'last-name');
        lastNameInput.setAttribute('maxlength', '20');
        lastNameInput.required = true;

        const submitButton = document.createElement('button');
        submitButton.setAttribute('id', 'submitFirstLast');
        submitButton.textContent = 'Create profile';
        submitButton.disabled = true;

        submitButton.addEventListener('click', function() {
            let firstName = document.getElementById('first-name').value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim();
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            let lastName = document.getElementById('last-name').value.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim();
            lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
            document.body.removeChild(popupDiv); // Remove the popup after submission
            fetch('server/newUser.php?', { // Add new user to db
                method: 'POST',
                body: JSON.stringify({username:playerName, firstName:firstName, lastName:lastName})
            }) 
                .then(response => response.json())
                .then(data => {userId = data;})
                loadModes();
                fetchActiveUsers(playerName, userId, 'true');
                startActivity();
                document.getElementById('mainMenu').style.display = 'block';    
        });

        newForm.addEventListener('input', function(e) {
            preventBlankInput(e.target.value, 'submitFirstLast');
        });

        // Append the form elements to the popup
        popupDiv.appendChild(header);
        newForm.appendChild(firstNameInput);
        newForm.appendChild(lastNameInput);
        newForm.appendChild(submitButton);
        popupDiv.appendChild(newForm);

        // Append the popup to the body
        document.body.appendChild(popupDiv);
        document.getElementById("first-name").focus();
    }

    function resetGameMode() {
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('gameoverWindow').style.display = 'none';
        document.getElementById("confettiCanvas").style.display = 'none';
        document.getElementById("combinedLeaderboardWindow").style.display = "none";
        document.getElementById("QuizContainer").style.filter = "blur(4px)";
        confetti = false;
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
                            updateTimer(gameLength);
                            gameModeId = selectedMode;
                            gameModeTitle = data[selectedMode]['display_name'];
                            console.log('Selected Game Mode: ' + gameModeTitle);
                            getFaceData(data[selectedMode]['year'], data[selectedMode]['tags']);
                        };
                    })(gameMode));
                    modeList.appendChild(listItem);
                }
            })
    }

    // Retrieve set of faces dictionary from server, faces mapped to array of img filepaths.
    function getFaceData(gameModeYear, gameModeTag) {
        fetch('server/data.php?' + new URLSearchParams({year:gameModeYear, set:gameModeTag}), {
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
                console.log(image + " cached\n");
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
        wrong = 0;
        skips = 0;
        document.getElementById("score").innerText = scoreManager.getScore();
        document.getElementById("textinput").disabled = false;
        document.getElementById("textinput").focus();

        // Blur first image during countdown
        const imgDiv = document.getElementById("imageElement");
        imgDiv.style.filter = "blur(26px)";
        loadNewFace();
        document.getElementById('mainMenu').style.display = 'none'; // Hide main menu

        // Start countdown to game start
        let tMinus = 2;
        //const countdownText = document.createElement("p");
        //countdownText.setAttribute("id", "countDown");
        //const imgContainer = document.getElementById("ImageContainer");
        var countdownText = document.getElementById("countDown");
        countdownText.innerHTML = "3";
        //imgContainer.appendChild(countdownText);
        preLoadImages();
        countDownSFX.play();
        const countDown = setInterval(function(){
            if (tMinus <= 0) {
                //imgContainer.lastChild.innerHTML = "";
                //imgContainer.innerHTML = "";
                //imgContainer.lastChild.remove();
                countdownText.innerHTML = "";
                imgDiv.style.filter = "none"; // Unblur first image when game start
                document.getElementById("submit").disabled = false;
                document.getElementById("skip").disabled = false;
                startTimer(gameLength); // Start timer
                clearInterval(countDown);
            } else {
                //imgContainer.lastChild.innerHTML = tMinus;
                countdownText.innerHTML = tMinus;
                tMinus--;
            }
        }, 1000);
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
        currentFace = keys[randomIndex];

        // Choose a random img in folder (if more than one) and set img src
        var randomImg = Math.floor(Math.random() * faces_working[currentFace].images.length);
        var path = faces_working[currentFace].images[randomImg];
        document.getElementById("imageElement").style.backgroundImage = 'url("'+path+'")';
        delete faces_working[currentFace]; // Remove face from working array so it's not repeated
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
        var correctAnswer = currentFace.toLowerCase().replace(/'/g, "").split("_");

        if (input[0].length == 0) {
            skips++;
        } else if (input[0] === correctAnswer[0] || (faces_all[currentFace].nicknames.includes(input[0]))) { // Check if input matches name or nickname
            scoreManager.incrementScore(); 
            
            // Play correct "ding" sfx
            ding1.play();
            flashGreen();

            // Check last name
            if (input.length > 1 && input[1] === correctAnswer[1]) {
                scoreManager.incrementScore(); 

                // Extra point for last names with hyphen
                if (correctAnswer[1].includes('-')) {
                    scoreManager.incrementScore(); 
                }
                setTimeout(function() {
                    ding2.play();}, 130);
            } 
        } else {
            wrong++;
        }

        console.log("Answer: " + correctAnswer);
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

    function toggleCombinedLeaderboard() {
        document.getElementById("gameoverWindow").style.display = "none";
        if (document.getElementById("combinedLeaderboardWindow").checkVisibility()) {
            document.getElementById("combinedLeaderboardWindow").style.display = "none";
        } else {
            fetchScores(true);
        }
    }

    function toggleLeaderboard() {
        document.getElementById("combinedLeaderboardWindow").style.display = "none";
        if (document.getElementById("gameoverWindow").checkVisibility()) {
            document.getElementById("gameoverWindow").style.display = "none";
        } else {
            fetchScores();
        }
    }

    function fetchScores(combined=false) {
        var fetchURL;
        var fetchOptions;
        if (combined) {
            fetchURL = 'server/combinedLeaderboard.php';
            fetchOptions = {method: 'GET'}
        }
        else {
            // Send name-score pair to server, returns updated leaderboard
            fetchURL = 'server/updateScores.php';
            fetchOptions = {
                method: 'POST',
                body: JSON.stringify({status: gameOver, name: playerName, userId: userId, score: scoreManager.getScore(), gameModeId: gameModeId, errors: wrong, skips: skips})
            }
        }
        fetch(fetchURL, fetchOptions)
            .then(response => response.json())
            .then(data => {
                // Display top score leaderboard
                var leaderboardTable;
                var leaderboardWindow;
                if (combined) {
                    leaderboardTable = document.getElementById("combinedLeaderboard");
                    leaderboardWindow = document.getElementById("combinedLeaderboardWindow");
                }
                else {
                    leaderboardTable = document.getElementById("leaderboard");
                    leaderboardWindow = document.getElementById("gameoverWindow");
                    const leaderboardHeader = document.getElementById("leaderboardHeader");
                    leaderboardHeader.innerHTML = "HIGH SCORES<br>";
                    let modeTitle = document.createElement("small");
                    modeTitle.innerHTML = gameModeTitle.toUpperCase();
                    leaderboardHeader.appendChild(modeTitle);
                }
                clearInterval(blinker);
                leaderboardTable.innerHTML = "";
                var sortedScores = data;
                var index = 0;
                leaderboardWindow.style.display = "block"; // Show popup window

                for (var i = 0; i<25; i++) {
                    if (!data[i] && i == 10) { // If less than 10 scores to show, exit early
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
                    var username = 'EMPTY';
                    var highScore = 0;
                    if (data[i]) {
                        username = data[i].username.toUpperCase();
                        highScore = data[i].high_score;
                    }
                    cell2.textContent = username;
                    row.appendChild(cell2);

                    const cell3 = document.createElement('td');
                    cell3.textContent = highScore;
                    row.appendChild(cell3);
                    row.style.color = "black";
                    leaderboardTable.appendChild(row);

                    // If player score is top ten and new, highlight & blink 
                    if (data[i]) {
                        if (!combined && sortedScores[index].high_score == scoreManager.getScore() && data[i].username == playerName) {
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
                                alert("Congrats on setting the new high score!\nYou are SO SMART and SO CAPABLE.");
                            } else {
                                newHighScoreSFX.play();
                            }
                        }
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
        toggleCombinedLeaderboard: toggleCombinedLeaderboard,
        loadNewFace: loadNewFace,
        checkAnswer: checkAnswer,
        skipFace: skipFace,
        setGamemode: setGameMode,
        resetGameMode: resetGameMode
    }
})();
