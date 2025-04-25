// render-sheet.js (fixed: merge drag-and-drop with ARS tabs + layout)

export function getStoredCharacters() {
    const raw = localStorage.getItem('greyhawk-characters');
    try {
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        console.error('Error parsing stored characters:', err);
        return [];
    }
  }

  export function saveStoredCharacters(chars) {
    localStorage.setItem("greyhawk-characters", JSON.stringify(chars));
  }

    function getActorId(actor) {
    return actor._id || actor.name || Math.random().toString(36).substring(2);
  }
  
  function deleteCharacterById(id) {
    const stored = getStoredCharacters();
    const filtered = stored.filter((c) => getActorId(c) !== id);
    saveStoredCharacters(filtered);

    // Remove the tab button
    const tabButton = document.querySelector(`.character-tab-button[data-target="character-${id}"]`);
    tabButton?.remove();

    // Remove the content area
    const characterDiv = document.getElementById(`character-${id}`);
    characterDiv?.remove();

    // Auto-select another tab if any remain
    const firstTab = document.querySelector('.character-tab-button');
    if (firstTab) firstTab.click();
}

  
  function clearAllCharacters() {
    localStorage.removeItem("greyhawk-characters");
    document.getElementById("character-tabs").innerHTML = "";
    document.getElementById("character-contents").innerHTML = "";
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
  
  export function renderCharacterSheet(actor) {
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
      { id: "spells", label: "Spells" },
      { id: "proficiencies", label: "Proficiencies" },
      { id: "details", label: "Details" }
    ];
  
    for (const tab of tabNames) {
      const btn = createTabButton(tab.id, tab.label, actorId);
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

    // display classes (multi-class support)
    const className = actor.system?.classname ?? "Unknown";

    // display race
    const raceName = actor.racename ?? "Unknown";

    // Capitalized or full name alignment
    const alignmentText = formatAlignment(actor.system?.details?.alignment || "Unknown");

    // display background
    const backgroundName = actor.system?.backgroundname || "None";

    console.log("🧙 Classname:", className);
    console.log("🧝 Racename:", raceName);
    mainTab.innerHTML = `
      <h3>${actor.name}</h3>

      <div><strong>Class:</strong> ${className} <strong>Race:</strong> ${raceName}</div>
       <div><strong>Alignment:</strong> ${alignmentText} <strong>Background:</strong> ${backgroundName}</div>

      <h4>Ability Scores</h4>
      <div class="flexrow">
        ${Object.entries(actor.system?.abilities || {}).map(([k, v]) => `
          <div><strong>${k.toUpperCase()}:</strong> ${v.value}</div>
        `).join('')}
      </div>

      <h4>Saving Throws</h4>
      <div class="flexrow">
        ${Object.entries(actor.system?.saves || {}).map(([k, v]) => `
          <div><strong>${k.toUpperCase()}:</strong> ${v?.value ?? v}</div>
        `).join('')}
      </div>
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

    // proficiencies tab
    const proficienciesTab = document.createElement("div");
    proficienciesTab.className = "tab-content";
    proficienciesTab.dataset.tab = "proficiencies";
    proficienciesTab.style.display = "none";

    const profHeader = document.createElement("h3");
    profHeader.textContent = "Proficiencies";
    proficienciesTab.appendChild(profHeader);

    console.log("🔎 Checking proficiencies for:", actor);
    console.log("🛠 system.proficiencies:", actor.proficiencies);
    
    const profs = actor.items?.filter(i => i.type === "proficiency") ?? [];
    console.log("📚 Found proficiencies:", profs.map(p => p.name));

    if (Array.isArray(profs) && profs.length > 0) {
      const list = document.createElement("ul");
      for (const prof of profs) {
        const li = document.createElement("li");
        li.textContent = prof.name ?? prof.label ?? "Unnamed";
        list.appendChild(li);  // ✅ Append to the list!
      }
      proficienciesTab.appendChild(list);  // ✅ Append the full list to the tab
      
        
        proficienciesTab.appendChild(list);
    } else {
        const note = document.createElement("p");
        note.textContent = "No proficiencies found.";
        proficienciesTab.appendChild(note);
    }

    // ensure tabs get toggled
    const tabButtons = sidebar.querySelectorAll("button");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
        const selected = btn.dataset.tab;
        contentArea.querySelectorAll(".tab-content").forEach(div => {
            div.style.display = div.dataset.tab === selected ? "block" : "none";
        });
        });
    });
    // end proficiencies tab

    // details tab
    const detailsTab = document.createElement("div");
    detailsTab.className = "tab-content";
    detailsTab.dataset.tab = "details";
    detailsTab.style.display = "none";

    const details = actor.system?.details ?? {};
    const prof = actor.system?.proficiency || actor.proficiency || {};
    const xp = actor.system?.details?.xp
      ? { total: actor.system.details.xp }
      : actor.system?.experience || actor.experience || {};
    const classes = actor.activeClasses ?? [];

    detailsTab.innerHTML = `
      <h3>Character Details</h3>
      <p><strong>Race:</strong> ${actor.system?.details?.race?.name || actor.details?.race?.name
        || "Unknown"}</p>
      <p><strong>Background:</strong> ${actor.system?.backgroundname || "None"}</p>

      <h4>Class</h4>
      <ul>
        ${classes.map(cls => `<li>${cls.name} (Level ${cls.system?.level ?? "?"})</li>`).join('') || "<li>None</li>"}
      </ul>


      <h4>Experience</h4>
      <p><strong>Earned:</strong> ${xp.total ?? 0} | <strong>Un-applied:</strong> ${xp.unapplied ?? 0}</p>

      <h4>Proficiency Totals</h4>
      <p><strong>Weapon:</strong> Used ${prof.weapon?.used ?? 0} / ${prof.weapon?.value ?? 0}</p>
      <p><strong>Non-Weapon:</strong> Used ${prof.skill?.used ?? 0} / ${prof.skill?.value ?? 0}</p>
      <p><strong>Class Points:</strong> Used ${prof.classpoints?.used ?? 0} / ${prof.classpoints?.value ?? 0}</p>
    `;
    // end details tab
    
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

    const renderMemorizedSpells = (source, label) => {
        const levels = Object.keys(source).sort((a, b) => parseInt(a) - parseInt(b));
        let found = false;
        for (const level of levels) {
        const spellEntries = Object.values(source[level] || {}).filter(s => s?.name);
        if (!spellEntries.length) continue;
        found = true;

        const header = document.createElement("h4");
        header.textContent = `${label} Spell Level ${level}`;
        spellsTab.appendChild(header);

        const table = document.createElement("table");
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '1em';

        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>
            <th style="text-align: left;">Name</th>
            <th style="text-align: left;">Level</th>
            <th style="text-align: left;">Sta</th>
            <th style="text-align: left;">Cmp</th>
            <th style="text-align: left;">CT</th>
            <th style="text-align: left;">Range</th>
            <th style="text-align: left;">AOE</th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (const spell of spellEntries) {
            const matchingItem = actor.items?.find(i => i._id === spell.id);
            const cmpObj = matchingItem?.system?.components || {};
            const cmp = [cmpObj.verbal ? 'V' : '', cmpObj.somatic ? 'S' : '', cmpObj.material ? 'M' : ''].filter(Boolean).join(', ');
            const ct = matchingItem?.system?.time ?? "";
            const range = matchingItem?.system?.range ?? "";
            const aoe = matchingItem?.system?.aoe ?? "";

            const isCast = spell.cast === true;
            const stateText = isCast ? "Used" : "Ready";
            const rowStyle = isCast ? "opacity: 0.5; font-style: italic;" : "";

            const row = document.createElement("tr");
            row.setAttribute("style", rowStyle);
            row.innerHTML = `
            <td style="text-align: left;"><img src="${spell.img}" alt="" style="height: 1em; vertical-align: middle; margin-right: 4px;"> ${spell.name}</td>
            <td style="text-align: left;">${spell.level ?? ''}</td>
            <td style="text-align: left;">${stateText}</td>
            <td style="text-align: left;">${cmp}</td>
            <td style="text-align: left;">${ct}</td>
            <td style="text-align: left;">${range}</td>
            <td style="text-align: left;">${aoe}</td>`;
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        spellsTab.appendChild(table);
        }
        return found;
    };

    const arcane = actor.system?.spellInfo?.memorization?.arcane || {};
    const divine = actor.system?.spellInfo?.memorization?.divine || {};

    const hasArcane = renderMemorizedSpells(arcane, "Arcane");
    const hasDivine = renderMemorizedSpells(divine, "Divine");

    if (!hasArcane && !hasDivine) {
        const emptyNote = document.createElement("p");
        emptyNote.textContent = "No memorized arcane or divine spells.";
        spellsTab.appendChild(emptyNote);
    }
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
  
    // First: Render containers
    const containers = actor.items?.filter(i => i.type === "container") || [];
    containers.forEach(container => {
      itemsTab.appendChild(renderContainer(container));
    });

    // Then: Render loose inventory items (outside containers)
    const inventoryTypes = [
      "weapon", "armor", "equipment", "item",
      "currency", "consumable", "treasure", "potion"
    ];

    const looseItems = actor.items?.filter(i => 
      inventoryTypes.includes(i.type) && 
      !i.system?.location?.parent
    ) || [];
    
    if (looseItems.length > 0) {
      const looseHeader = document.createElement("h4");
      looseHeader.textContent = "Loose Items";
      itemsTab.appendChild(document.createElement("hr"));
      itemsTab.appendChild(looseHeader);
    
      const table = document.createElement("table");
      table.className = "inventory-grid";
    
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th></th>
          <th>Name</th>
          <th>Status</th>
          <th>Qty</th>
          <th>Weight</th>
        </tr>`;
      table.appendChild(thead);
    
      const tbody = document.createElement("tbody");
    
      looseItems.forEach(item => {
        const tr = document.createElement("tr");
        tr.setAttribute("draggable", "true");
        tr.dataset.uuid = item._id || "";
    
        // Icon
        const iconTd = document.createElement("td");
        const img = document.createElement("img");
        img.src = item.img;
        img.style.height = "1em";
        img.style.verticalAlign = "middle";
        img.onerror = function handler() {
          img.onerror = null; // prevent infinite loop
          img.src = "icons/items/misc/sack.webp"; // fallback once
        };
        
        iconTd.appendChild(img);
        tr.appendChild(iconTd);
    
        // Name
        const nameTd = document.createElement("td");
        nameTd.innerHTML = item.name;
        if (item.system?.magical) {
          nameTd.style.color = "blue"; // or add ✨
        }
        tr.appendChild(nameTd);
    
        // Status (Carried/Equipped/Not Carried)
        const statusTd = document.createElement("td");
        const carriedState = item.system?.carried ?? "carried";
        statusTd.textContent = carriedState.charAt(0).toUpperCase() + carriedState.slice(1);
        tr.appendChild(statusTd);
    
        // Quantity
        const qtyTd = document.createElement("td");
        const quantity = item.system?.quantity ?? 1;
        qtyTd.textContent = quantity;
        tr.appendChild(qtyTd);
    
        // Weight
        const weightTd = document.createElement("td");
        const weight = item.system?.weight ?? 0;
        weightTd.textContent = weight;
        tr.appendChild(weightTd);
    
        tbody.appendChild(tr);
      });
    
      table.appendChild(tbody);
      itemsTab.appendChild(table);
    }

    contentArea.appendChild(mainTab);
    contentArea.appendChild(combatTab);
    contentArea.appendChild(itemsTab);
    contentArea.appendChild(spellsTab);
    contentArea.appendChild(proficienciesTab);
    contentArea.appendChild(detailsTab);

    // Restore last selected tab (per character)
    const lastTab = localStorage.getItem(`charTab-${actorId}`) || "main";

    sidebar.querySelectorAll(".tab-btn").forEach((btn) => {
      if (btn.dataset.tab === lastTab) btn.classList.add("active");
    });

    contentArea.querySelectorAll(".tab-content").forEach((tab) => {
      tab.style.display = tab.dataset.tab === lastTab ? "block" : "none";
    });
  
    wrapper.appendChild(sidebar);
    wrapper.appendChild(contentArea);
    const tabsContainer = document.getElementById("character-tabs");
    const contentsContainer = document.getElementById("character-contents");

    // Create tab button
    const tabButton = document.createElement("button");
    tabButton.textContent = actor.name;
    tabButton.className = "character-tab-button";
    tabButton.dataset.target = `character-${actorId}`;
    tabsContainer.appendChild(tabButton);

    // Create content wrapper
    const characterDiv = document.createElement("div");
    characterDiv.className = "character-content";
    characterDiv.id = `character-${actorId}`;
    characterDiv.style.display = "none"; // Hide initially
    characterDiv.appendChild(wrapper);
    contentsContainer.appendChild(characterDiv);

    // Tab switching behavior
    tabButton.addEventListener("click", () => {
        document.querySelectorAll(".character-content").forEach(div => div.style.display = "none");
        document.querySelectorAll(".character-tab-button").forEach(btn => btn.classList.remove("active"));

        characterDiv.style.display = "block";
        tabButton.classList.add("active");
    });

    // Auto-click the first tab
    if (tabsContainer.childElementCount === 1) {
        tabButton.click();
    }
  }

  window.getStoredCharacters = getStoredCharacters;
  window.saveStoredCharacters = saveStoredCharacters;
  window.renderCharacterSheet = renderCharacterSheet;
  
  
  export function loadCharactersFromLocalStorage() {
    const stored = getStoredCharacters();
    document.getElementById('character-tabs').innerHTML = '';
    document.getElementById('character-contents').innerHTML = '';
    stored.forEach(actor => renderCharacterSheet(actor));
}

  function setupCharacterUpload() {
    const input = document.getElementById("character-upload");
    if (!input) return;
  
    input.addEventListener("change", (event) => {
      const files = Array.from(event.target.files);
      const stored = getStoredCharacters();
  
      Promise.all(
        files.map((file) =>
          file.text().then((text) => {
            try {
              return JSON.parse(text);
            } catch (err) {
              console.error("Failed to parse uploaded JSON:", file.name, err);
              return null;
            }
          })
        )
      ).then((newChars) => {
        const validChars = newChars.filter(c => c && c.name); // Filter out nulls or bad data
        const updated = [...stored, ...validChars];
  
        console.log("🧙 Uploaded characters:", validChars.map(c => c.name));
        console.log("📦 Saving characters to localStorage:", updated.map(c => c.name));
  
        saveStoredCharacters(updated);
        document.getElementById("character-grid").innerHTML = "";
        updated.forEach(renderCharacterSheet);
      });
    });
  
    // Add Clear Button
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "🗑️ Clear All Characters";
    clearBtn.style.marginTop = "10px";
    clearBtn.addEventListener("click", () => {
      clearAllCharacters();
      console.log("🚫 Cleared characters from localStorage");
    });
  
    input.insertAdjacentElement("afterend", clearBtn);
  }
  
  
  export function initializeCharacterRenderer() {
    loadCharactersFromLocalStorage();
    setupCharacterUpload();
  }
  
  function createTabButton(name, label, actorId) {
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
  
      // 🧠 Save last selected tab for this character
      localStorage.setItem(`charTab-${actorId}`, name);
    });
  
    return btn;
  }
  
  function localIconPath(img) {
    // If it's a Foundry/ARS internal icon, remap to local /icons/ folder
    if (img?.startsWith("systems/ars/icons/")) {
      return img.replace("systems/ars/icons/", "icons/");
    }
    return img; // external or custom image
  }

  function formatAlignment(alignment) {
    const map = {
      l: "Lawful",
      n: "Neutral",
      c: "Chaotic",
      g: "Good",
      e: "Evil"
    };
    if (!alignment) return "Unknown";
  
    const chars = alignment.toLowerCase().split("");
    return chars.map(c => map[c] || "?").join(" ");
  }
  
  