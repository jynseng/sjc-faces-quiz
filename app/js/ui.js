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
    header.innerHTML = 'Enter name';

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

    const submitButton = document.createElement('button');
    submitButton.id = 'submitFirstLast';
    submitButton.textContent = 'Create profile';
    submitButton.disabled = true;

    newForm.addEventListener('input', function(e) {
        const value = e.target.value.trim();
        submitButton.disabled = value.length === 0;
    });

    submitButton.addEventListener('click', function () {
        let firstName = sanitizeAndCapitalize(document.getElementById('first-name').value);
        let lastName = sanitizeAndCapitalize(document.getElementById('last-name').value);
        document.body.removeChild(popupDiv);
        onSubmit(playerName, firstName, lastName);
    });

    newForm.appendChild(firstNameInput);
    newForm.appendChild(lastNameInput);
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
