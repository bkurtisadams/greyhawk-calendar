// render-sheet.js (ARS-style layout)

function getStoredCharacters() {
    return JSON.parse(localStorage.getItem('uploadedCharacters') || '[]');
}

function saveStoredCharacters(chars) {
    localStorage.setItem('uploadedCharacters', JSON.stringify(chars));
}

function getActorId(actor) {
    return actor._id || actor.name || Math.random().toString(36).substring(2);
}

function deleteCharacterById(id) {
    const stored = getStoredCharacters();
    const filtered = stored.filter(c => getActorId(c) !== id);
    saveStoredCharacters(filtered);
    document.getElementById(`character-${id}`)?.remove();
}

function clearAllCharacters() {
    localStorage.removeItem('uploadedCharacters');
    document.getElementById('character-grid').innerHTML = '';
}

function renderCharacterSheet(actor) {
    const actorId = getActorId(actor);
    const container = document.createElement('div');
    container.className = 'character-card';
    container.id = `character-${actorId}`;

    // Profile Header
    const header = document.createElement('div');
    header.className = 'flexrow';
    header.innerHTML = `
        <img src="${actor.img}" style="width: 64px; height: 64px; border-radius: 5px; margin-right: 10px;">
        <h3 style="flex-grow:1;">${actor.name}</h3>
        <button style="background:none; border:none; cursor:pointer; font-size:1.2em;" title="Remove Character">❌</button>
    `;
    header.querySelector('button').addEventListener('click', () => deleteCharacterById(actorId));
    container.appendChild(header);

    // Class/Race/Background/Alignment block
    const infoBlock = document.createElement('div');
    infoBlock.className = 'flexcol';
    infoBlock.innerHTML = `
        <div class="flexrow"><strong>Class:</strong> ${actor.system?.classname || ''} &nbsp; <strong>Race:</strong> ${actor.racename || ''}</div>
        <div class="flexrow"><strong>Alignment:</strong> ${actor.system?.details?.alignment || ''} &nbsp; <strong>Background:</strong> ${actor.system?.backgroundname || ''}</div>
        <div class="flexrow"><strong>Size:</strong> ${actor.system?.attributes?.size || ''}
            ${actor.system?.attributes?.hnr ? `&nbsp; <strong>Honor:</strong> ${actor.system.attributes.hnr.value}` : ''}
        </div>
    `;
    container.appendChild(infoBlock);

    // Abilities & Saves grid
    const grid = document.createElement('div');
    grid.className = 'ability-save-grid';
    const abilities = actor.system?.abilities || {};
    const saves = actor.system?.saves || {};

    grid.innerHTML = `
        <div class="flexrow" style="margin-top:10px;"><strong>Ability Scores</strong></div>
        <div class="flexrow">
            ${Object.entries(abilities).map(([key, val]) => `
                <div class="character-stat"><strong>${key.toUpperCase()}:</strong> ${val.value}</div>
            `).join('')}
        </div>
        <div class="flexrow" style="margin-top:10px;"><strong>Saving Throws</strong></div>
        <div class="flexrow">
            ${Object.entries(saves).map(([key, val]) => `
                <div class="character-stat"><strong>${key.toUpperCase()}:</strong> ${val.value}</div>
            `).join('')}
        </div>
    `;
    container.appendChild(grid);

    document.getElementById('character-grid').appendChild(container);
}

function loadCharactersFromLocalStorage() {
    const stored = getStoredCharacters();
    stored.forEach(renderCharacterSheet);
}

function setupCharacterUpload() {
    const input = document.getElementById('character-upload');
    if (!input) return;

    input.addEventListener('change', function (event) {
        const files = Array.from(event.target.files);
        const stored = getStoredCharacters();

        Promise.all(files.map(file => file.text().then(text => JSON.parse(text))))
            .then(newChars => {
                const updated = [...stored, ...newChars];
                saveStoredCharacters(updated);
                document.getElementById('character-grid').innerHTML = '';
                updated.forEach(renderCharacterSheet);
            });
    });

    // Add clear all button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Clear All Characters';
    clearBtn.style.marginTop = '10px';
    clearBtn.addEventListener('click', clearAllCharacters);
    input.insertAdjacentElement('afterend', clearBtn);
}

export function initializeCharacterRenderer() {
    loadCharactersFromLocalStorage();
    setupCharacterUpload();
}
