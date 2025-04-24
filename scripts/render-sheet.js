// render-sheet.js (with ARS-style tab layout: Main, Combat, Items)

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

function createTabButton(name, label) {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = label;
    btn.dataset.tab = name;
    btn.addEventListener('click', () => {
        const parent = btn.closest('.character-card');
        parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
        btn.classList.add('active');
        parent.querySelector(`.tab-content[data-tab="${name}"]`).style.display = 'block';
    });
    return btn;
}

function renderCharacterSheet(actor) {
    const actorId = getActorId(actor);
    const wrapper = document.createElement('div');
    wrapper.className = 'character-card';
    wrapper.id = `character-${actorId}`;
    wrapper.style.display = 'flex';
    wrapper.style.border = '1px solid #ccc';
    wrapper.style.borderRadius = '6px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.marginBottom = '1em';

    const sidebar = document.createElement('div');
    sidebar.className = 'tab-sidebar';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.padding = '0.5em';
    sidebar.style.background = '#eee';
    sidebar.style.borderRight = '1px solid #ccc';
    sidebar.style.minWidth = '100px';

    const contentArea = document.createElement('div');
    contentArea.className = 'tab-content-area';
    contentArea.style.flexGrow = '1';
    contentArea.style.padding = '1em';

    const tabNames = [
        { id: 'main', label: 'Main' },
        { id: 'combat', label: 'Combat' },
        { id: 'items', label: 'Items' }
    ];

    for (const tab of tabNames) {
        const btn = createTabButton(tab.id, tab.label);
        sidebar.appendChild(btn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.title = 'Delete Character';
    deleteBtn.style.marginTop = 'auto';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.addEventListener('click', () => deleteCharacterById(actorId));
    sidebar.appendChild(deleteBtn);

    // Tabs content
    const mainTab = document.createElement('div');
    mainTab.className = 'tab-content';
    mainTab.dataset.tab = 'main';
    mainTab.style.display = 'block';

    const header = document.createElement('h3');
    header.textContent = actor.name;
    mainTab.appendChild(header);

    const infoBlock = document.createElement('div');
    infoBlock.innerHTML = `
        <strong>Class:</strong> ${actor.system?.classname || ''} <strong>Race:</strong> ${actor.racename || ''}<br>
        <strong>Alignment:</strong> ${actor.system?.details?.alignment || ''} <strong>Background:</strong> ${actor.system?.backgroundname || ''}<br>
        <strong>Size:</strong> ${actor.system?.attributes?.size || ''} <strong>Honor:</strong> ${actor.system?.attributes?.hnr?.value || 0}<br>
    `;
    mainTab.appendChild(infoBlock);

    const grid = document.createElement('div');
    const abilities = actor.system?.abilities || {};
    const saves = actor.system?.saves || {};

    grid.innerHTML = `
        <h4>Ability Scores</h4>
        <div class="flexrow">${Object.entries(abilities).map(([key, val]) => `
            <div><strong>${key.toUpperCase()}:</strong> ${val.value}</div>`).join('')}</div>
        <h4>Saving Throws</h4>
        <div class="flexrow">${Object.entries(saves).map(([key, val]) => `
            <div><strong>${key.toUpperCase()}:</strong> ${val}</div>`).join('')}</div>
    `;
    mainTab.appendChild(grid);

    const combatTab = document.createElement('div');
    combatTab.className = 'tab-content';
    combatTab.dataset.tab = 'combat';
    combatTab.style.display = 'none';
    combatTab.innerHTML = `
        <h3>Combat</h3>
        <p><strong>AC:</strong> ${actor.system?.ac?.value ?? '?'} | 
           <strong>Shieldless:</strong> ${actor.system?.ac?.shieldless ?? '?'} | 
           <strong>Rear:</strong> ${actor.system?.ac?.rear ?? '?'}</p>
        <p><strong>HP:</strong> ${actor.system?.hp?.value ?? '?'} / ${actor.system?.hp?.max ?? '?'}</p>
        <p><strong>Movement:</strong> ${actor.system?.attributes?.move?.value ?? '?'}</p>
    `;

    const itemsTab = document.createElement('div');
    itemsTab.className = 'tab-content';
    itemsTab.dataset.tab = 'items';
    itemsTab.style.display = 'none';

    const looseItems = actor.items?.filter(i => !i.system?.location?.parent && i.type !== 'container') || [];
    const ul = document.createElement('ul');
    looseItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} x${item.system?.quantity ?? 1}`;
        ul.appendChild(li);
    });
    itemsTab.appendChild(ul);

    contentArea.appendChild(mainTab);
    contentArea.appendChild(combatTab);
    contentArea.appendChild(itemsTab);

    wrapper.appendChild(sidebar);
    wrapper.appendChild(contentArea);

    document.getElementById('character-grid').appendChild(wrapper);
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