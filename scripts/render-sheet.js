// render-sheet.js (drag-and-drop for inventory items)

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

function makeListDraggable(ul) {
    ul.addEventListener('dragstart', e => {
        if (e.target.tagName === 'LI') {
            e.dataTransfer.setData('text/plain', e.target.dataset.uuid || '');
            e.target.classList.add('dragging');
        }
    });

    ul.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = ul.querySelector('.dragging');
        const after = [...ul.children].find(child =>
            child !== dragging && e.clientY < child.getBoundingClientRect().top + child.offsetHeight / 2);
        if (after) ul.insertBefore(dragging, after);
        else ul.appendChild(dragging);
    });

    ul.addEventListener('drop', e => {
        e.preventDefault();
        ul.querySelectorAll('li').forEach(li => li.classList.remove('dragging'));
    });

    ul.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
    });
}

function renderContainer(containerItem, nested = false) {
    const wrapper = document.createElement('div');
    wrapper.className = nested ? 'nested-container' : 'container';
    const toggle = document.createElement('details');
    toggle.open = true;
    const summary = document.createElement('summary');
    summary.textContent = containerItem.name;
    toggle.appendChild(summary);

    const list = document.createElement('ul');
    const items = containerItem.system?.itemList || [];
    for (let subItem of items) {
        const li = document.createElement('li');
        li.textContent = `${subItem.name} x${subItem.quantity ?? 1}`;
        li.setAttribute('draggable', 'true');
        li.dataset.uuid = subItem.uuid || '';
        if (subItem.type === 'container') {
            const nestedBlock = renderContainer(subItem, true);
            li.appendChild(nestedBlock);
        }
        list.appendChild(li);
    }
    makeListDraggable(list);
    toggle.appendChild(list);
    wrapper.appendChild(toggle);
    return wrapper;
}

function renderCharacterSheet(actor) {
    const actorId = getActorId(actor);
    const wrapper = document.createElement('div');
    wrapper.className = 'character-card';
    wrapper.id = `character-${actorId}`;
    wrapper.style.display = 'flex';
    wrapper.style.width = '100%';
    wrapper.style.minWidth = '960px';
    wrapper.style.border = '1px solid #ccc';
    wrapper.style.borderRadius = '6px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.margin = '1em auto';
    wrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const sidebar = document.createElement('div');
    sidebar.className = 'tab-sidebar';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.padding = '0.5em';
    sidebar.style.background = '#eee';
    sidebar.style.borderRight = '1px solid #ccc';
    sidebar.style.minWidth = '120px';

    const contentArea = document.createElement('div');
    contentArea.className = 'tab-content-area';
    contentArea.style.flexGrow = '1';
    contentArea.style.padding = '1em';
    contentArea.style.background = '#fff';
    contentArea.style.overflowX = 'auto';

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
    deleteBtn.style.fontSize = '1.2em';
    deleteBtn.addEventListener('click', () => deleteCharacterById(actorId));
    sidebar.appendChild(deleteBtn);

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
            <div><strong>${key.toUpperCase()}:</strong> ${val?.value ?? val}</div>`).join('')}</div>
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

    const containers = actor.items?.filter(i => i.type === 'container') || [];
    containers.forEach(c => {
        const containerBlock = renderContainer(c);
        itemsTab.appendChild(containerBlock);
    });

    const looseItems = actor.items?.filter(i => !i.system?.location?.parent && i.type !== 'container') || [];
    if (looseItems.length > 0) {
        const ul = document.createElement('ul');
        looseItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} x${item.system?.quantity ?? 1}`;
            li.setAttribute('draggable', 'true');
            li.dataset.uuid = item._id || '';
            ul.appendChild(li);
        });
        makeListDraggable(ul);
        itemsTab.appendChild(document.createElement('hr'));
        itemsTab.appendChild(document.createTextNode('Loose Items'));
        itemsTab.appendChild(ul);
    }

    contentArea.appendChild(mainTab);
    contentArea.appendChild(combatTab);
    contentArea.appendChild(itemsTab);

    wrapper.appendChild(sidebar);
    wrapper.appendChild(contentArea);

    document.getElementById('character-grid').appendChild(wrapper);
}

function loadCharactersFromLocalStorage() {
    const stored = getStoredCharacters();
    document.getElementById('character-grid').innerHTML = '';
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