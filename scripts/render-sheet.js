// render-sheet.js (fixed: merge drag-and-drop with ARS tabs + layout)

function getStoredCharacters() {
    return JSON.parse(localStorage.getItem("uploadedCharacters") || "[]");
  }
  
  function saveStoredCharacters(chars) {
    localStorage.setItem("uploadedCharacters", JSON.stringify(chars));
  }
  
  function getActorId(actor) {
    return actor._id || actor.name || Math.random().toString(36).substring(2);
  }
  
  function deleteCharacterById(id) {
    const stored = getStoredCharacters();
    const filtered = stored.filter((c) => getActorId(c) !== id);
    saveStoredCharacters(filtered);
    document.getElementById(`character-${id}`)?.remove();
  }
  
  function clearAllCharacters() {
    localStorage.removeItem("uploadedCharacters");
    document.getElementById("character-grid").innerHTML = "";
  }
  
  function createTabButton(name, label) {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = label;
    btn.dataset.tab = name;
    btn.style.padding = "0.5em";
    btn.style.marginBottom = "4px";
    btn.style.width = "100%";
    btn.style.border = "1px solid #ccc";
    btn.style.background = "#f0f0f0";
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      const parent = btn.closest(".character-card");
      parent.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      parent.querySelectorAll(".tab-content").forEach((tc) => (tc.style.display = "none"));
      btn.classList.add("active");
      parent.querySelector(`.tab-content[data-tab="${name}"]`).style.display = "block";
    });
    return btn;
  }
  
  function makeListDraggable(ul) {
    ul.addEventListener("dragstart", (e) => {
      if (e.target.tagName === "LI") {
        e.dataTransfer.setData("text/plain", e.target.dataset.uuid || "");
        e.target.classList.add("dragging");
      }
    });
  
    ul.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = ul.querySelector(".dragging");
      const after = [...ul.children].find(
        (child) =>
          child !== dragging &&
          e.clientY < child.getBoundingClientRect().top + child.offsetHeight / 2
      );
      if (after) ul.insertBefore(dragging, after);
      else ul.appendChild(dragging);
    });
  
    ul.addEventListener("drop", (e) => {
      e.preventDefault();
      ul.querySelectorAll("li").forEach((li) => li.classList.remove("dragging"));
    });
  
    ul.addEventListener("dragend", (e) => {
      e.target.classList.remove("dragging");
    });
  }
  
  function renderContainer(containerItem, nested = false) {
    const wrapper = document.createElement("div");
    wrapper.className = nested ? "nested-container" : "container";
    const toggle = document.createElement("details");
    toggle.open = true;
    const summary = document.createElement("summary");
    summary.textContent = containerItem.name;
    toggle.appendChild(summary);
  
    const list = document.createElement("ul");
    const items = containerItem.system?.itemList || [];
    for (let subItem of items) {
      const li = document.createElement("li");
      li.textContent = `${subItem.name} x${subItem.quantity ?? 1}`;
      li.setAttribute("draggable", "true");
      li.dataset.uuid = subItem.uuid || "";
      if (subItem.type === "container") {
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
    const wrapper = document.createElement("div");
    wrapper.className = "character-card";
    wrapper.id = `character-${actorId}`;
    wrapper.style.display = "flex";
    wrapper.style.width = "100%";
    wrapper.style.minWidth = "960px";
    wrapper.style.border = "1px solid #ccc";
    wrapper.style.borderRadius = "6px";
    wrapper.style.overflow = "hidden";
    wrapper.style.margin = "1em auto";
    wrapper.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  
    const sidebar = document.createElement("div");
    sidebar.className = "tab-sidebar";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.padding = "0.5em";
    sidebar.style.background = "#eee";
    sidebar.style.borderRight = "1px solid #ccc";
    sidebar.style.minWidth = "120px";
  
    const contentArea = document.createElement("div");
    contentArea.className = "tab-content-area";
    contentArea.style.flexGrow = "1";
    contentArea.style.padding = "1em";
    contentArea.style.background = "#fff";
    contentArea.style.overflowX = "auto";
  
    const tabNames = [
      { id: "main", label: "Main" },
      { id: "combat", label: "Combat" },
      { id: "items", label: "Items" },
      { id: "spells", label: "Spells" }
    ];
  
    for (const tab of tabNames) {
      const btn = createTabButton(tab.id, tab.label);
      sidebar.appendChild(btn);
    }
  
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.title = "Delete Character";
    deleteBtn.style.marginTop = "auto";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = "1.2em";
    deleteBtn.addEventListener("click", () => deleteCharacterById(actorId));
    sidebar.appendChild(deleteBtn);
  
    const mainTab = document.createElement("div");
    mainTab.className = "tab-content";
    mainTab.dataset.tab = "main";
    mainTab.style.display = "block";
  
    mainTab.innerHTML = `
      <h3>${actor.name}</h3>
      <div><strong>Class:</strong> ${actor.system?.classname || ""} <strong>Race:</strong> ${actor.racename || ""}</div>
      <div><strong>Alignment:</strong> ${actor.system?.details?.alignment || ""} <strong>Background:</strong> ${actor.system?.backgroundname || ""}</div>
      <div><strong>Size:</strong> ${actor.system?.attributes?.size || ""} <strong>Honor:</strong> ${actor.system?.attributes?.hnr?.value ?? 0}</div>
      <h4>Ability Scores</h4>
      <div class="flexrow">${Object.entries(actor.system?.abilities || {}).map(([k, v]) => `<div><strong>${k.toUpperCase()}:</strong> ${v.value}</div>`).join('')}</div>
      <h4>Saving Throws</h4>
      <div class="flexrow">${Object.entries(actor.system?.saves || {}).map(([k, v]) => `<div><strong>${k.toUpperCase()}:</strong> ${v?.value ?? v}</div>`).join('')}</div>
    `;
  
    const combatTab = document.createElement("div");
    combatTab.className = "tab-content";
    combatTab.dataset.tab = "combat";
    combatTab.style.display = "none";
    combatTab.innerHTML = `
      <h3>Combat</h3>
      <p><strong>AC:</strong> ${actor.system?.ac?.value ?? "?"} | <strong>Shieldless:</strong> ${actor.system?.ac?.shieldless ?? "?"} | <strong>Rear:</strong> ${actor.system?.ac?.rear ?? "?"}</p>
      <p><strong>HP:</strong> ${actor.system?.hp?.value ?? "?"} / ${actor.system?.hp?.max ?? "?"}</p>
      <p><strong>Movement:</strong> ${actor.system?.attributes?.move?.value ?? "?"}</p>
    `;
  
    const itemsTab = document.createElement("div");
    itemsTab.className = "tab-content";
    itemsTab.dataset.tab = "items";
    itemsTab.style.display = "none";

    // Spell tab content
    const spellsTab = document.createElement("div");
    spellsTab.className = "tab-content";
    spellsTab.dataset.tab = "spells";
    spellsTab.style.display = "none";

    const slots = actor.system?.spells || {};
    const slotLevels = Object.keys(slots).sort();
    if (slotLevels.length > 0) {
        const slotHeader = document.createElement("h4");
        slotHeader.textContent = "Spell Slots";
        spellsTab.appendChild(slotHeader);
        const slotList = document.createElement("ul");
        for (const lvl of slotLevels) {
        const entry = slots[lvl];
        const label = lvl.replace("lvl", "Level ");
        const li = document.createElement("li");
        li.textContent = `${label}: ${entry.value ?? 0} / ${entry.max ?? 0}`;
        slotList.appendChild(li);
        }
        spellsTab.appendChild(slotList);
    }

    const memorized = actor.system?.spellInfo?.memorization?.arcane || {};
    const levels = Object.keys(memorized).sort((a, b) => parseInt(a) - parseInt(b));

    let foundAny = false;
    for (const level of levels) {
        const spellEntries = Object.values(memorized[level] || {}).filter(s => s?.name);
        if (!spellEntries.length) continue;
        foundAny = true;

        const header = document.createElement("h4");
        header.textContent = `Spell Level ${level}`;
        spellsTab.appendChild(header);

        const table = document.createElement("table");
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>
        <th>Name</th>
        <th>Level</th>
        <th>Cmp</th>
        <th>CT</th>
        <th>Range</th>
        <th>AOE</th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (const spell of spellEntries) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${spell.img}" alt="" style="height: 1em; vertical-align: middle; margin-right: 4px;"> ${spell.name}</td>
            <td>${spell.level ?? ''}</td>
            <td>${spell.components ?? ''}</td>
            <td>${spell.time ?? ''}</td>
            <td>${spell.range ?? ''}</td>
            <td>${spell.aoe ?? ''}</td>`;
        tbody.appendChild(row);
        }
        table.appendChild(tbody);
        spellsTab.appendChild(table);
    }

    if (!foundAny) {
        const emptyNote = document.createElement("p");
        emptyNote.textContent = "No memorized arcane spells.";
        spellsTab.appendChild(emptyNote);
    }

    contentArea.appendChild(mainTab);
    contentArea.appendChild(combatTab);
    contentArea.appendChild(itemsTab);
    contentArea.appendChild(spellsTab);

    // end spells tab content

    // 💰 MONEY SECTION
    const currencies = actor.items?.filter((i) => i.type === "currency") || [];
    if (currencies.length > 0) {
        const moneyHeader = document.createElement("h4");
        moneyHeader.textContent = "Money";
        itemsTab.appendChild(moneyHeader);
        const moneyList = document.createElement("ul");
        currencies.forEach((coin) => {
        const li = document.createElement("li");
        li.textContent = `${coin.name}: ${coin.system?.quantity ?? 0}`;
        moneyList.appendChild(li);
        });
        itemsTab.appendChild(moneyList);
    }
  
    const containers = actor.items?.filter((i) => i.type === "container") || [];
    containers.forEach((c) => itemsTab.appendChild(renderContainer(c)));
  
    const looseItems = actor.items?.filter((i) => !i.system?.location?.parent && i.type !== "container") || [];
    if (looseItems.length) {
      const ul = document.createElement("ul");
      looseItems.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} x${item.system?.quantity ?? 1}`;
        li.setAttribute("draggable", "true");
        li.dataset.uuid = item._id || "";
        ul.appendChild(li);
      });
      makeListDraggable(ul);
      itemsTab.appendChild(document.createElement("hr"));
      itemsTab.appendChild(document.createTextNode("Loose Items"));
      itemsTab.appendChild(ul);
    }
  
    contentArea.appendChild(mainTab);
    contentArea.appendChild(combatTab);
    contentArea.appendChild(itemsTab);
  
    wrapper.appendChild(sidebar);
    wrapper.appendChild(contentArea);
    document.getElementById("character-grid").appendChild(wrapper);
  }
  
  function loadCharactersFromLocalStorage() {
    const stored = getStoredCharacters();
    document.getElementById("character-grid").innerHTML = "";
    stored.forEach(renderCharacterSheet);
  }
  
  function setupCharacterUpload() {
    const input = document.getElementById("character-upload");
    if (!input) return;
    input.addEventListener("change", (event) => {
      const files = Array.from(event.target.files);
      const stored = getStoredCharacters();
      Promise.all(files.map((file) => file.text().then((text) => JSON.parse(text)))).then((newChars) => {
        const updated = [...stored, ...newChars];
        saveStoredCharacters(updated);
        document.getElementById("character-grid").innerHTML = "";
        updated.forEach(renderCharacterSheet);
      });
    });
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "🗑️ Clear All Characters";
    clearBtn.style.marginTop = "10px";
    clearBtn.addEventListener("click", clearAllCharacters);
    input.insertAdjacentElement("afterend", clearBtn);
  }
  
  export function initializeCharacterRenderer() {
    loadCharactersFromLocalStorage();
    setupCharacterUpload();
  }
  