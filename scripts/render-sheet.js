// render-sheet.js

function getStoredCharacters() {
    return JSON.parse(localStorage.getItem('uploadedCharacters') || '[]');
}

function saveStoredCharacters(chars) {
    localStorage.setItem('uploadedCharacters', JSON.stringify(chars));
}

function groupItemsByContainer(items) {
    const grouped = {};
    for (let item of items) {
        const container = item.system?.location?.parent || 'Loose Items';
        if (!grouped[container]) grouped[container] = [];
        grouped[container].push(item);
    }
    return grouped;
}

function renderCharacterSheet(actor) {
    const container = document.createElement('div');
    container.className = 'character-card';

    const name = actor.name || 'Unnamed';
    container.innerHTML = `<h3>${name}</h3>`;

    const stats = actor.system?.abilities || {};
    const statList = Object.entries(stats).map(([key, val]) => {
        return `<div class="character-stat"><strong>${key.toUpperCase()}:</strong> ${val.value}</div>`;
    }).join('');

    container.innerHTML += `<div class="character-stats">${statList}</div>`;

    const groupedItems = groupItemsByContainer(actor.items || []);
    for (let [pack, items] of Object.entries(groupedItems)) {
        const ul = document.createElement('ul');
        ul.classList.add('item-list');
        ul.setAttribute('data-container', pack);
        ul.setAttribute('draggable', 'true');

        for (let item of items) {
            const li = document.createElement('li');
            li.textContent = `${item.name} x${item.system?.quantity ?? 1}`;
            li.setAttribute('draggable', 'true');
            ul.appendChild(li);
        }

        const subheader = document.createElement('h4');
        subheader.textContent = pack;
        container.appendChild(subheader);
        container.appendChild(ul);
    }

    document.getElementById('character-grid').appendChild(container);
}

function makeDraggable() {
    document.querySelectorAll('.item-list').forEach(list => {
        list.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', e.target.innerText);
            e.target.classList.add('dragging');
        });

        list.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            const after = [...list.children].find(child =>
                e.clientY < child.getBoundingClientRect().top + child.offsetHeight / 2);
            if (after) list.insertBefore(dragging, after);
            else list.appendChild(dragging);
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            dragging.classList.remove('dragging');
        });

        list.addEventListener('dragend', e => {
            e.target.classList.remove('dragging');
        });
    });
}

function loadCharactersFromLocalStorage() {
    const stored = getStoredCharacters();
    stored.forEach(renderCharacterSheet);
    makeDraggable();
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
                makeDraggable();
            });
    });
}

// Exported initializer
export function initializeCharacterRenderer() {
    loadCharactersFromLocalStorage();
    setupCharacterUpload();
}
