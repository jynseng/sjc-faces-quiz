export function showElement(id) {
    document.getElementById(id).style.display = 'block';
}

export function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

export function setBlur(id, blurAmount) {
    document.getElementById(id).style.filter = `blur(${blurAmount})`;
}

export function showNewUserPopup(playerName, onSubmit) {
    const popupDiv = document.createElement('div');
    popupDiv.className = 'popup';

    const header = document.createElement('h2');
    header.innerHTML = 'Create New Profile';

    const newForm = document.createElement('form');
    newForm.setAttribute('id', 'userFirstLast');

    const firstNameInput = document.createElement('input');
    firstNameInput.type = 'text';
    firstNameInput.placeholder = 'First Name';
    firstNameInput.id = 'first-name';
    firstNameInput.maxLength = 20;
    firstNameInput.required = true;

    const lastNameInput = document.createElement('input');
    lastNameInput.type = 'text';
    lastNameInput.placeholder = 'Last Name';
    lastNameInput.id = 'last-name';
    lastNameInput.maxLength = 20;
    lastNameInput.required = true;

    const codewordInput = document.createElement('input');
    codewordInput.type = 'text';
    codewordInput.placeholder = 'Leave blank to play as guest';
    codewordInput.id = 'codeword';
    codewordInput.maxLength = 20;
    codewordInput.required = false;

    const codewordLabel = document.createElement('label');
    codewordLabel.innerHTML = '<br><br>Verification: Who lived in cabin 9<br>before it burned down?';

    const submitButton = document.createElement('button');
    submitButton.id = 'submitFirstLast';
    submitButton.textContent = 'Submit';

    newForm.addEventListener('submit', function (e) {
        e.preventDefault(); // stop native submission, but keep validation
        if (!newForm.checkValidity()) return; // run HTML5 required checks
        
        let firstName = sanitizeAndCapitalize(firstNameInput.value);
        let lastName = sanitizeAndCapitalize(lastNameInput.value);
        let codeword = sanitizeAndCapitalize(codewordInput.value);
        document.body.removeChild(popupDiv);
        onSubmit(playerName, firstName, lastName, codeword);
    });


    newForm.appendChild(firstNameInput);
    newForm.appendChild(lastNameInput);
    newForm.appendChild(codewordLabel);
    newForm.appendChild(codewordInput);
    newForm.appendChild(submitButton);

    popupDiv.appendChild(header);
    popupDiv.appendChild(newForm);
    document.body.appendChild(popupDiv);
    document.getElementById("first-name").focus();
}

function sanitizeAndCapitalize(name) {
    name = name.replace(/[^a-zA-Z0-9\s-]/g, "").toLowerCase().trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function resetGameUI() {
    showElement('mainMenu');
    hideElement('gameoverWindow');
    hideElement('confettiCanvas');
    hideElement('combinedLeaderboardWindow');
    setBlur('QuizContainer', 4);
}
