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
    wrapper.style.width = "100%";
    wrapper.style.minWidth = "960px";
    wrapper.style.border = "1px solid #ccc";
    wrapper.style.borderRadius = "6px";
    wrapper.style.overflow = "hidden";
    wrapper.style.margin = "1em auto";
    wrapper.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    
    // Character header section (consistent across all tabs)
    const headerSection = document.createElement("div");
    headerSection.className = "character-header";
    headerSection.style.padding = "10px";
    headerSection.style.borderBottom = "1px solid #ccc";
    headerSection.style.background = "#f8f8f0";
    
    // Character name and image
    const nameContainer = document.createElement("div");
    nameContainer.style.display = "flex";
    nameContainer.style.alignItems = "center";
    nameContainer.style.marginBottom = "10px";
    
    // Character portrait
    const portrait = document.createElement("div");
    portrait.style.width = "64px";
    portrait.style.height = "64px";
    portrait.style.marginRight = "10px";
    portrait.style.border = "1px solid #666";
    portrait.style.borderRadius = "5px";
    portrait.style.overflow = "hidden";
    portrait.style.flexShrink = "0";
    
    const portraitImg = document.createElement("img");
    portraitImg.src = actor.img || "icons/svg/mystery-man.svg";
    portraitImg.style.width = "100%";
    portraitImg.style.height = "100%";
    portraitImg.style.objectFit = "cover";
    portrait.appendChild(portraitImg);
    
    // Character name input
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = actor.name || "Unknown";
    nameInput.style.fontSize = "18px";
    nameInput.style.fontWeight = "bold";
    nameInput.style.width = "100%";
    nameInput.style.padding = "8px";
    nameInput.style.border = "1px solid #ccc";
    nameInput.style.borderRadius = "4px";
    nameInput.readOnly = true;
    
    nameContainer.appendChild(portrait);
    nameContainer.appendChild(nameInput);
    headerSection.appendChild(nameContainer);
  
    // Combat section (consistent across all tabs)
    const combatSection = document.createElement("div");
    combatSection.className = "combat-section";
    combatSection.style.padding = "10px";
    combatSection.style.backgroundColor = "#e8e8d8";
    combatSection.style.border = "1px solid #ccc";
    combatSection.style.borderRadius = "5px";
    combatSection.style.marginBottom = "10px";
    
    // Combat header
    const combatHeader = document.createElement("div");
    combatHeader.className = "section-header";
    combatHeader.textContent = "Combat";
    combatHeader.style.backgroundColor = "#271744";
    combatHeader.style.color = "white";
    combatHeader.style.padding = "5px 10px";
    combatHeader.style.fontWeight = "bold";
    combatHeader.style.borderRadius = "3px";
    combatHeader.style.marginBottom = "10px";
    
    // Combat stats container
    const combatStats = document.createElement("div");
    combatStats.className = "combat-stats";
    combatStats.style.display = "flex";
    combatStats.style.justifyContent = "space-between";
    
    // AC section
    const acSection = document.createElement("div");
    acSection.style.display = "flex";
    acSection.style.alignItems = "center";
    
    const acValue = document.createElement("div");
    acValue.className = "ac-value";
    acValue.style.display = "flex";
    acValue.style.flexDirection = "column";
    acValue.style.alignItems = "center";
    acValue.style.background = "#e0e0d0";
    acValue.style.borderRadius = "50%";
    acValue.style.width = "50px";
    acValue.style.height = "50px";
    acValue.style.padding = "5px";
    acValue.style.marginRight = "10px";
    acValue.style.justifyContent = "center";
    
    const acLabel = document.createElement("div");
    acLabel.textContent = "Armor Class";
    acLabel.style.fontSize = "10px";
    
    const acNum = document.createElement("div");
    acNum.textContent = actor.system?.attributes?.ac?.value || "10";
    acNum.style.fontSize = "24px";
    acNum.style.fontWeight = "bold";
    
    acValue.appendChild(acLabel);
    acValue.appendChild(acNum);
    
    const acDetails = document.createElement("div");
    acDetails.style.display = "flex";
    acDetails.style.flexDirection = "column";
    
    const shieldlessRow = document.createElement("div");
    shieldlessRow.innerHTML = `<span>Shieldless</span> <span>${actor.system?.attributes?.ac?.shieldless || actor.system?.attributes?.ac?.value || "10"}</span>`;
    shieldlessRow.style.display = "flex";
    shieldlessRow.style.justifyContent = "space-between";
    
    const rearRow = document.createElement("div");
    rearRow.innerHTML = `<span>Rear</span> <span>${actor.system?.attributes?.ac?.rear || actor.system?.attributes?.ac?.value || "10"}</span>`;
    rearRow.style.display = "flex";
    rearRow.style.justifyContent = "space-between";
    
    acDetails.appendChild(shieldlessRow);
    acDetails.appendChild(rearRow);
    
    acSection.appendChild(acValue);
    acSection.appendChild(acDetails);
    
    // Hit Points section
    const hpSection = document.createElement("div");
    hpSection.style.flex = "1";
    hpSection.style.display = "flex";
    hpSection.style.flexDirection = "column";
    hpSection.style.margin = "0 10px";
    
    const hpLabel = document.createElement("div");
    hpLabel.textContent = "Current Hit Points";
    hpLabel.style.fontSize = "12px";
    
    const hpBar = document.createElement("div");
    hpBar.style.display = "flex";
    hpBar.style.alignItems = "center";
    hpBar.style.margin = "5px 0";
    
    const hpValue = document.createElement("div");
    hpValue.textContent = actor.system?.attributes?.hp?.value || "0";
    hpValue.style.fontSize = "32px";
    hpValue.style.fontWeight = "bold";
    hpValue.style.marginRight = "10px";
    
    const progressContainer = document.createElement("div");
    progressContainer.style.flex = "1";
    progressContainer.style.height = "10px";
    progressContainer.style.background = "#ccc";
    progressContainer.style.borderRadius = "5px";
    progressContainer.style.overflow = "hidden";
    
    const progressBar = document.createElement("div");
    const hpValue2 = actor.system?.attributes?.hp?.value || 0;
    const hpMax = actor.system?.attributes?.hp?.max || 0;
    const hpPercent = hpMax > 0 ? (hpValue2 / hpMax) * 100 : 0;
    progressBar.style.width = `${hpPercent}%`;
    progressBar.style.height = "100%";
    progressBar.style.background = "linear-gradient(to right, #83c783, #56ab56)";
    progressContainer.appendChild(progressBar);
    
    hpBar.appendChild(hpValue);
    hpBar.appendChild(progressContainer);
    
    const hpStat = document.createElement("div");
    hpStat.style.display = "flex";
    hpStat.style.justifyContent = "space-between";
    
    const maxLabel = document.createElement("div");
    maxLabel.textContent = "Max";
    
    const maxValue = document.createElement("div");
    maxValue.textContent = actor.system?.attributes?.hp?.max || "0";
    
    const currentLabel = document.createElement("div");
    currentLabel.textContent = "Current";
    
    const currentValue = document.createElement("div");
    currentValue.textContent = actor.system?.attributes?.hp?.value || "0";
    
    hpStat.appendChild(maxLabel);
    hpStat.appendChild(maxValue);
    hpStat.appendChild(currentLabel);
    hpStat.appendChild(currentValue);
    
    hpSection.appendChild(hpLabel);
    hpSection.appendChild(hpBar);
    hpSection.appendChild(hpStat);
    
    // Movement section
    const moveSection = document.createElement("div");
    moveSection.style.display = "flex";
    moveSection.style.alignItems = "center";
    
    const moveIcon = document.createElement("div");
    moveIcon.style.width = "40px";
    moveIcon.style.height = "40px";
    moveIcon.style.backgroundColor = "#e0e0d0";
    moveIcon.style.borderRadius = "50%";
    moveIcon.style.display = "flex";
    moveIcon.style.justifyContent = "center";
    moveIcon.style.alignItems = "center";
    moveIcon.style.marginRight = "10px";
    moveIcon.innerHTML = "Move";
    
    const moveDetails = document.createElement("div");
    moveDetails.style.display = "flex";
    moveDetails.style.flexDirection = "column";
    
    const moveValue = document.createElement("div");
    moveValue.style.fontSize = "32px";
    moveValue.style.fontWeight = "bold";
    moveValue.textContent = actor.system?.attributes?.movement?.value || "90";
    
    const moveBase = document.createElement("div");
    moveBase.style.display = "flex";
    moveBase.style.justifyContent = "space-between";
    
    const baseLabel = document.createElement("div");
    baseLabel.textContent = "Base";
    
    const baseValue = document.createElement("div");
    baseValue.textContent = actor.system?.attributes?.movement?.value || "90";
    
    const progressContainer2 = document.createElement("div");
    progressContainer2.style.width = "100px";
    progressContainer2.style.height = "10px";
    progressContainer2.style.background = "#ccc";
    progressContainer2.style.borderRadius = "5px";
    progressContainer2.style.overflow = "hidden";
    progressContainer2.style.margin = "5px 0";
    
    const progressBar2 = document.createElement("div");
    progressBar2.style.width = "100%";
    progressBar2.style.height = "100%";
    progressBar2.style.background = "linear-gradient(to right, #83c783, #56ab56)";
    progressContainer2.appendChild(progressBar2);
    
    moveBase.appendChild(baseLabel);
    moveBase.appendChild(baseValue);
    
    moveDetails.appendChild(moveValue);
    moveDetails.appendChild(moveBase);
    moveDetails.appendChild(progressContainer2);
    
    moveSection.appendChild(moveIcon);
    moveSection.appendChild(moveDetails);
    
    // Attack Matrix section
    const matrixSection = document.createElement("div");
    matrixSection.style.display = "flex";
    matrixSection.style.alignItems = "center";
    
    const matrixIcon = document.createElement("div");
    matrixIcon.style.width = "40px";
    matrixIcon.style.height = "40px";
    matrixIcon.style.backgroundImage = "url('icons/svg/sword.svg')";
    matrixIcon.style.backgroundSize = "contain";
    matrixIcon.style.backgroundPosition = "center";
    matrixIcon.style.backgroundRepeat = "no-repeat";
    matrixIcon.style.opacity = "0.5";
    
    const matrixText = document.createElement("div");
    matrixText.textContent = "Attack Matrix";
    matrixText.style.marginLeft = "10px";
    
    matrixSection.appendChild(matrixIcon);
    matrixSection.appendChild(matrixText);
    
    // Add all sections to combat stats
    combatStats.appendChild(acSection);
    combatStats.appendChild(hpSection);
    combatStats.appendChild(moveSection);
    combatStats.appendChild(matrixSection);
    
    combatSection.appendChild(combatHeader);
    combatSection.appendChild(combatStats);
    
    headerSection.appendChild(combatSection);
    wrapper.appendChild(headerSection);
    
    // Main content area with tab system
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "character-content-wrapper";
    contentWrapper.style.display = "flex";
    
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
      { id: "character", label: "Character" },
      { id: "matrix", label: "Matrix" },
      { id: "weapons", label: "Weapons" },
      { id: "actions", label: "Actions" },
      { id: "skills", label: "Skills" },
      { id: "items", label: "Items" }, 
      { id: "spells", label: "Spells" },
      { id: "proficiencies", label: "Proficiencies" }
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
    
    // Create tab contents
    const characterTab = createCharacterTab(actor);
    const matrixTab = createMatrixTab(actor);
    const weaponsTab = createWeaponsTab(actor);
    const actionsTab = createActionsTab(actor);
    const skillsTab = createSkillsTab(actor);
    const spellsTab = createSpellsTab(actor);
    const proficienciesTab = createProficienciesTab(actor);
    
    // Add tabs to content area
    contentArea.appendChild(characterTab);
    contentArea.appendChild(matrixTab);
    contentArea.appendChild(weaponsTab);
    contentArea.appendChild(actionsTab);
    contentArea.appendChild(skillsTab);
    contentArea.appendChild(itemsTab); 
    contentArea.appendChild(spellsTab);
    contentArea.appendChild(proficienciesTab);
    
    contentWrapper.appendChild(sidebar);
    contentWrapper.appendChild(contentArea);
    wrapper.appendChild(contentWrapper);
    
    // Restore last selected tab (per character)
    const lastTab = localStorage.getItem(`charTab-${actorId}`) || "character";
    
    sidebar.querySelectorAll(".tab-btn").forEach((btn) => {
      if (btn.dataset.tab === lastTab) btn.classList.add("active");
    });
    
    contentArea.querySelectorAll(".tab-content").forEach((tab) => {
      tab.style.display = tab.dataset.tab === lastTab ? "block" : "none";
    });
    
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
  
  // Tab content generation functions
  function createCharacterTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "character";
    tab.style.display = "block";
    
    // Character header with purple background
    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = "Character";
    header.style.backgroundColor = "#271744";
    header.style.color = "white";
    header.style.padding = "5px 10px";
    header.style.fontWeight = "bold";
    header.style.borderRadius = "3px";
    header.style.marginBottom = "10px";
    
    tab.appendChild(header);
    
    // Character grid
    const grid = document.createElement("div");
    grid.className = "character-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "auto 1fr";
    grid.style.gap = "5px";
    grid.style.background = "#e8e8d8";
    grid.style.padding = "10px";
    grid.style.borderRadius = "5px";
    
    // Class info
    const classLabel = document.createElement("div");
    classLabel.textContent = "Class";
    classLabel.style.fontWeight = "bold";
    
    const classValue = document.createElement("div");
    const classItem = actor.items?.find(i => i.type === "class");
    const classLevel = classItem?.system?.level || "";
    classValue.textContent = classItem ? `${classItem.name} ${classLevel}` : "Unknown";
    
    // Race info
    const raceLabel = document.createElement("div");
    raceLabel.textContent = "Race";
    raceLabel.style.fontWeight = "bold";
    
    const raceValue = document.createElement("div");
    const raceItem = actor.items?.find(i => i.type === "race");
    raceValue.textContent = raceItem?.name || "Unknown";
    
    // Alignment info
    const alignmentLabel = document.createElement("div");
    alignmentLabel.textContent = "Alignment";
    alignmentLabel.style.fontWeight = "bold";
    
    const alignmentValue = document.createElement("div");
    alignmentValue.textContent = formatAlignment(actor.system?.details?.alignment || "Unknown");
    
    // Background info
    const backgroundLabel = document.createElement("div");
    backgroundLabel.textContent = "Background";
    backgroundLabel.style.fontWeight = "bold";
    
    const backgroundValue = document.createElement("div");
    backgroundValue.textContent = actor.system?.backgroundname || "None";
    
    // Size info
    const sizeLabel = document.createElement("div");
    sizeLabel.textContent = "Size";
    sizeLabel.style.fontWeight = "bold";
    
    const sizeValue = document.createElement("div");
    sizeValue.textContent = actor.system?.attributes?.size || "Medium";
    
    // Add all to the grid
    grid.appendChild(classLabel);
    grid.appendChild(classValue);
    grid.appendChild(raceLabel);
    grid.appendChild(raceValue);
    grid.appendChild(alignmentLabel);
    grid.appendChild(alignmentValue);
    grid.appendChild(backgroundLabel);
    grid.appendChild(backgroundValue);
    grid.appendChild(sizeLabel);
    grid.appendChild(sizeValue);
    
    tab.appendChild(grid);
    
    // Abilities section
    const abilitiesHeader = document.createElement("div");
    abilitiesHeader.textContent = "Abilities";
    abilitiesHeader.style.textAlign = "center";
    abilitiesHeader.style.borderBottom = "1px solid #ccc";
    abilitiesHeader.style.marginTop = "20px";
    abilitiesHeader.style.marginBottom = "10px";
    abilitiesHeader.style.fontSize = "14px";
    tab.appendChild(abilitiesHeader);
    
    // Abilities grid
    const abilitiesGrid = document.createElement("div");
    abilitiesGrid.style.display = "grid";
    abilitiesGrid.style.gridTemplateColumns = "repeat(6, 1fr)";
    abilitiesGrid.style.gap = "5px";
    
    // Abilities headers
    const abilityNames = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
    
    // Create ability boxes
    abilityKeys.forEach((key, index) => {
      const abilityBox = document.createElement("div");
      abilityBox.style.border = "1px solid #ccc";
      abilityBox.style.borderRadius = "3px";
      abilityBox.style.padding = "5px";
      abilityBox.style.textAlign = "center";
      
      const abilityName = document.createElement("div");
      abilityName.textContent = abilityNames[index];
      abilityName.style.fontWeight = "bold";
      
      const abilityValue = document.createElement("div");
      abilityValue.textContent = actor.system?.abilities?.[key]?.value || "10";
      abilityValue.style.fontSize = "24px";
      abilityValue.style.fontWeight = "bold";
      
      // Add percent for STR if it exists
      if (key === "str" && actor.system?.abilities?.str?.percent) {
        const percentValue = actor.system.abilities.str.percent;
        if (percentValue > 0) {
          const percent = document.createElement("div");
          percent.textContent = `${percentValue}%`;
          percent.style.fontSize = "12px";
          abilityBox.appendChild(percent);
        }
      }
      
      abilityBox.appendChild(abilityName);
      abilityBox.appendChild(abilityValue);
      abilitiesGrid.appendChild(abilityBox);
    });
    
    tab.appendChild(abilitiesGrid);
    
    // Saves section
    const savesHeader = document.createElement("div");
    savesHeader.textContent = "Saves";
    savesHeader.style.textAlign = "center";
    savesHeader.style.borderBottom = "1px solid #ccc";
    savesHeader.style.marginTop = "20px";
    savesHeader.style.marginBottom = "10px";
    savesHeader.style.fontSize = "14px";
    tab.appendChild(savesHeader);
    
    // Saves grid
    const savesGrid = document.createElement("div");
    savesGrid.style.display = "grid";
    savesGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
    savesGrid.style.gap = "5px";
    
    // Save types
    const saveTypes = [
      { key: "paralyzation", label: "Para" },
      { key: "poison", label: "Poison" },
      { key: "death", label: "Death" },
      { key: "rod", label: "Rod" },
      { key: "staff", label: "Staff" },
      { key: "wand", label: "Wand" },
      { key: "petrification", label: "Petri" },
      { key: "polymorph", label: "Poly" },
      { key: "breath", label: "Breath" },
      { key: "spell", label: "Spell" }
    ];
    
    // Create save boxes
    saveTypes.forEach((save) => {
      const saveBox = document.createElement("div");
      saveBox.style.border = "1px solid #ccc";
      saveBox.style.borderRadius = "3px";
      saveBox.style.padding = "5px";
      saveBox.style.textAlign = "center";
      
      const saveName = document.createElement("div");
      saveName.textContent = save.label;
      
      const saveValue = document.createElement("div");
      saveValue.textContent = actor.system?.saves?.[save.key]?.value || "15";
      saveValue.style.fontSize = "18px";
      saveValue.style.fontWeight = "bold";
      saveValue.style.borderRadius = "50%";
      saveValue.style.width = "30px";
      saveValue.style.height = "30px";
      saveValue.style.display = "flex";
      saveValue.style.alignItems = "center";
      saveValue.style.justifyContent = "center";
      saveValue.style.margin = "0 auto";
      saveValue.style.background = "#e0e0d0";
      
      saveBox.appendChild(saveName);
      saveBox.appendChild(saveValue);
      savesGrid.appendChild(saveBox);
    });
    
    tab.appendChild(savesGrid);
    
    // Items section (checkbox)
    const itemsBox = document.createElement("div");
    itemsBox.style.border = "1px solid #ccc";
    itemsBox.style.borderRadius = "3px";
    itemsBox.style.padding = "5px";
    itemsBox.style.textAlign = "center";
    itemsBox.style.marginTop = "10px";
    itemsBox.style.background = "#e0e0d0";
    
    const itemsCheck = document.createElement("div");
    itemsCheck.innerHTML = "✓ Items";
    itemsCheck.style.fontWeight = "bold";
    
    itemsBox.appendChild(itemsCheck);
    tab.appendChild(itemsBox);
    
    return tab;
  }
  
  // Then add the createItemsTab function
  function createItemsTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "items";
    tab.style.display = "none";
    
    // Items header with purple background
    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = "Items";
    header.style.backgroundColor = "#271744";
    header.style.color = "white";
    header.style.padding = "5px 10px";
    header.style.fontWeight = "bold";
    header.style.borderRadius = "3px";
    header.style.marginBottom = "10px";
    
    tab.appendChild(header);
    
    // 💰 MONEY SECTION
    const currencies = actor.items?.filter((i) => i.type === "currency") || [];
    if (currencies.length > 0) {
      const moneyHeader = document.createElement("h4");
      moneyHeader.textContent = "Money";
      tab.appendChild(moneyHeader);
      
      const moneyList = document.createElement("ul");
      currencies.forEach((coin) => {
        const li = document.createElement("li");
        li.textContent = `${coin.name}: ${coin.system?.quantity ?? 0}`;
        moneyList.appendChild(li);
      });
      
      tab.appendChild(moneyList);
    }

    // CONTAINERS SECTION
    const containers = actor.items?.filter(i => i.type === "container") || [];
    
    if (containers.length > 0) {
      const containersHeader = document.createElement("h4");
      containersHeader.textContent = "Containers";
      tab.appendChild(containersHeader);
      
      containers.forEach(container => {
        const containerDiv = document.createElement("div");
        containerDiv.className = "container-item";
        containerDiv.style.marginBottom = "15px";
        
        // Container header
        const contHeader = document.createElement("div");
        contHeader.style.display = "flex";
        contHeader.style.alignItems = "center";
        contHeader.style.padding = "5px";
        contHeader.style.backgroundColor = "#e0e0d0";
        contHeader.style.borderRadius = "3px";
        
        const contIcon = document.createElement("img");
        contIcon.src = container.img;
        contIcon.alt = "";
        contIcon.style.width = "24px";
        contIcon.style.height = "24px";
        contIcon.style.marginRight = "10px";
        
        const contName = document.createElement("strong");
        contName.textContent = container.name;
        
        contHeader.appendChild(contIcon);
        contHeader.appendChild(contName);
        containerDiv.appendChild(contHeader);
        
        // Container contents
        const contentsList = document.createElement("ul");
        contentsList.style.marginLeft = "30px";
        
        const contents = container.system?.itemList || [];
        contents.forEach(item => {
          const li = document.createElement("li");
          li.textContent = `${item.name} (${item.quantity || 1})`;
          contentsList.appendChild(li);
        });
        
        containerDiv.appendChild(contentsList);
        tab.appendChild(containerDiv);
      });
    }
    
    // INVENTORY SECTION
    const inventoryTypes = [
      "weapon", "armor", "equipment", "item",
      "consumable", "treasure", "potion"
    ];
    
    const looseItems = actor.items?.filter(i => 
      inventoryTypes.includes(i.type) && 
      !i.system?.location?.parent
    ) || [];
    
    if (looseItems.length > 0) {
      const looseHeader = document.createElement("h4");
      looseHeader.textContent = "Loose Items";
      tab.appendChild(document.createElement("hr"));
      tab.appendChild(looseHeader);
      
      const table = document.createElement("table");
      table.className = "inventory-grid";
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      
      const headers = ["", "Name", "Status", "Qty", "Weight"];
      
      headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.padding = "5px";
        th.style.textAlign = header === "" ? "center" : "left";
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      const tbody = document.createElement("tbody");
      
      looseItems.forEach(item => {
        const tr = document.createElement("tr");
        tr.style.backgroundColor = "#f0f0e0";
        tr.style.borderBottom = "1px solid #ddd";
        
        // Icon
        const iconTd = document.createElement("td");
        iconTd.style.textAlign = "center";
        
        const img = document.createElement("img");
        img.src = item.img;
        img.alt = "";
        img.style.width = "20px";
        img.style.height = "20px";
        
        iconTd.appendChild(img);
        tr.appendChild(iconTd);
        
        // Name
        const nameTd = document.createElement("td");
        nameTd.textContent = item.name;
        
        // Add magical styling if needed
        if (item.system?.attributes?.magic) {
          nameTd.style.color = "blue";
        }
        
        tr.appendChild(nameTd);
        
        // Status (Carried/Equipped/Not Carried)
        const statusTd = document.createElement("td");
        let status = "Carried";
        
        if (item.system?.location?.state === "equipped") {
          status = "Equipped";
        } else if (item.system?.location?.state === "nocarried") {
          status = "Not Carried";
        }
        
        statusTd.textContent = status;
        tr.appendChild(statusTd);
        
        // Quantity
        const qtyTd = document.createElement("td");
        qtyTd.textContent = item.system?.quantity || 1;
        tr.appendChild(qtyTd);
        
        // Weight
        const weightTd = document.createElement("td");
        weightTd.textContent = item.system?.weight || 0;
        tr.appendChild(weightTd);
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      tab.appendChild(table);
    }
    
    return tab;
  }

  // Make sure to create and append the items tab in the main render function
  const itemsTab = createItemsTab(actor);
  contentArea.appendChild(itemsTab);
  // Example of createMatrixTab
  function createMatrixTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "matrix";
    tab.style.display = "none";
    
    // Matrix header with purple background
    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = "Matrix";
    header.style.backgroundColor = "#271744";
    header.style.color = "white";
    header.style.padding = "5px 10px";
    header.style.fontWeight = "bold";
    header.style.borderRadius = "3px";
    header.style.marginBottom = "10px";
    
    tab.appendChild(header);
    
    // Create matrix grid
    const matrixGrid = document.createElement("div");
    matrixGrid.style.display = "grid";
    matrixGrid.style.gridTemplateColumns = "repeat(21, 1fr)";
    matrixGrid.style.textAlign = "center";
    
    // To hit values
    const toHitValues = ["-10", "-9", "-8", "-7", "-6", "-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "AC"];
    const dieRollValues = ["20", "20", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "ROLL"];
    
    // Highlight the value that matches the actor's thaco
    const thaco = parseInt(actor.system?.attributes?.thaco?.value || "20");
    
    // Add "to hit" row
    toHitValues.forEach(value => {
      const cell = document.createElement("div");
      cell.textContent = value;
      cell.style.border = "1px solid #aaa";
      cell.style.padding = "5px";
      
      // Highlight AC 0 (which is typically around the 10th cell)
      if (value === "0") {
        cell.style.backgroundColor = "red";
        cell.style.color = "white";
      }
      
      matrixGrid.appendChild(cell);
    });
    
    // Add die roll row
    dieRollValues.forEach((value, index) => {
      const cell = document.createElement("div");
      cell.textContent = value;
      cell.style.border = "1px solid #aaa";
      cell.style.padding = "5px";
      
      // Highlight the die roll that matches THACO
      if (value == thaco) {
        cell.style.backgroundColor = "red";
        cell.style.color = "white";
      }
      
      matrixGrid.appendChild(cell);
    });
    
    tab.appendChild(matrixGrid);
    
    return tab;
  }
  
  // Stubs for other tab creation functions
  function createWeaponsTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "weapons";
    tab.style.display = "none";
    
    // Weapons header with purple background
    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = "Weapons";
    header.style.backgroundColor = "#271744";
    header.style.color = "white";
    header.style.padding = "5px 10px";
    header.style.fontWeight = "bold";
    header.style.borderRadius = "3px";
    header.style.marginBottom = "10px";
    
    tab.appendChild(header);
    
    // Weapons table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    
    // Table header
    const thead = document.createElement("thead");
    thead.style.backgroundColor = "#e0e0d0";
    
    const headerRow = document.createElement("tr");
    const headers = ["Name", "PR SP", "#ATKS", "DMG", "Type"];
    
    // Continue from the previous code where we were creating the weapons tab header row

  headers.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.padding = "8px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Table body
  const tbody = document.createElement("tbody");
  
  // Get all weapons from the actor's items
  const weapons = actor.items?.filter(i => i.type === "weapon") || [];
  
  weapons.forEach(weapon => {
    const row = document.createElement("tr");
    row.style.backgroundColor = "#f0f0e0";
    row.style.borderBottom = "1px solid #ddd";
    
    // Name with icon
    const nameCell = document.createElement("td");
    nameCell.style.padding = "8px";
    nameCell.style.display = "flex";
    nameCell.style.alignItems = "center";
    
    const icon = document.createElement("img");
    icon.src = weapon.img;
    icon.alt = "";
    icon.style.width = "20px";
    icon.style.height = "20px";
    icon.style.marginRight = "8px";
    
    const nameText = document.createElement("span");
    nameText.textContent = weapon.name;
    
    nameCell.appendChild(icon);
    nameCell.appendChild(nameText);
    
    // Proficiency column with green checkmark
    const profCell = document.createElement("td");
    profCell.style.padding = "8px";
    
    const profIcon = document.createElement("span");
    profIcon.textContent = "✅";
    profIcon.style.color = "#4caf50";
    
    const profText = document.createElement("span");
    profText.textContent = weapon.system?.prof || "0";
    profText.style.marginLeft = "5px";
    
    profCell.appendChild(profIcon);
    profCell.appendChild(profText);
    
    // Attacks per round
    const attacksCell = document.createElement("td");
    attacksCell.textContent = weapon.system?.attack?.perRound || "1/1";
    attacksCell.style.padding = "8px";
    
    // Damage
    const damageCell = document.createElement("td");
    damageCell.textContent = weapon.system?.damage?.normal || "1d6";
    damageCell.style.padding = "8px";
    
    // Damage type
    const typeCell = document.createElement("td");
    typeCell.textContent = weapon.system?.damage?.type || "slashing";
    typeCell.style.padding = "8px";
    
    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(profCell);
    row.appendChild(attacksCell);
    row.appendChild(damageCell);
    row.appendChild(typeCell);
    
    // Add ammunition row for ranged weapons if they have ammo tracking
    if (weapon.system?.attack?.type === "ranged" && !weapon.system?.attributes?.infiniteammo) {
      const ammoRow = document.createElement("tr");
      ammoRow.style.backgroundColor = "#e8e8d8";
      
      const ammoCell = document.createElement("td");
      ammoCell.textContent = "Ammo";
      ammoCell.style.padding = "4px 8px";
      ammoCell.style.paddingLeft = "30px";
      ammoCell.style.fontSize = "0.9em";
      ammoCell.colSpan = 5;
      
      ammoRow.appendChild(ammoCell);
      tbody.appendChild(row);
      tbody.appendChild(ammoRow);
    } else {
      tbody.appendChild(row);
    }
  });
  
  table.appendChild(tbody);
  tab.appendChild(table);
  
  return tab;
}

function createActionsTab(actor) {
  const tab = document.createElement("div");
  tab.className = "tab-content";
  tab.dataset.tab = "actions";
  tab.style.display = "none";
  
  // Actions header with purple background
  const header = document.createElement("div");
  header.className = "section-header";
  header.textContent = "Actions";
  header.style.backgroundColor = "#271744";
  header.style.color = "white";
  header.style.padding = "5px 10px";
  header.style.fontWeight = "bold";
  header.style.borderRadius = "3px";
  header.style.marginBottom = "10px";
  
  // Add button
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  addBtn.style.backgroundColor = "#271744";
  addBtn.style.color = "white";
  addBtn.style.border = "none";
  addBtn.style.borderRadius = "3px";
  addBtn.style.padding = "2px 8px";
  addBtn.style.float = "right";
  addBtn.style.cursor = "pointer";
  
  header.appendChild(addBtn);
  tab.appendChild(header);
  
  // Drop zone
  const dropZone = document.createElement("div");
  dropZone.textContent = "<<Drop Action Group Or Object With Actions Here To Copy>>";
  dropZone.style.background = "#f0f0e0";
  dropZone.style.border = "1px dashed #666";
  dropZone.style.padding = "10px";
  dropZone.style.textAlign = "center";
  dropZone.style.marginBottom = "10px";
  dropZone.style.color = "#555";
  tab.appendChild(dropZone);
  
  // Get actions from actor
  const actionList = document.createElement("div");
  actionList.className = "action-list";
  
  // Extract action groups and actions
  const actionGroups = actor.actionGroups || [];
  const actions = actor.actions || [];
  
  // Find action items - these can be in various formats depending on export
  let actionItems = [];
  
  // If actionGroups exist, use those
  if (actionGroups.length > 0) {
    actionItems = actionGroups;
  } 
  // Otherwise check for actions directly
  else if (actions.length > 0) {
    // Group actions by parent/type
    const groupedActions = {};
    actions.forEach(action => {
      const groupName = action.name.split(':')[0] || 'Miscellaneous';
      if (!groupedActions[groupName]) {
        groupedActions[groupName] = {
          name: groupName,
          img: action.img,
          actions: []
        };
      }
      groupedActions[groupName].actions.push(action);
    });
    actionItems = Object.values(groupedActions);
  }
  // Finally check for items with actions
  else {
    const itemsWithActions = actor.items?.filter(i => 
      i.actions && i.actions.length > 0
    ) || [];
    
    actionItems = itemsWithActions.map(item => ({
      name: item.name,
      img: item.img,
      actions: item.actions || []
    }));
  }
  
  // Render each action group
  actionItems.forEach(group => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "action-group";
    groupDiv.style.marginBottom = "4px";
    groupDiv.style.border = "1px solid #aaa";
    groupDiv.style.borderRadius = "3px";
    groupDiv.style.backgroundColor = "#e8e8d8";
    
    // Group header
    const header = document.createElement("div");
    header.className = "action-group-header";
    header.style.padding = "5px";
    header.style.cursor = "pointer";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    
    // Left side with icon and name
    const nameDiv = document.createElement("div");
    nameDiv.style.display = "flex";
    nameDiv.style.alignItems = "center";
    
    const icon = document.createElement("img");
    icon.src = group.img || "icons/svg/mystery-man.svg";
    icon.alt = "";
    icon.style.width = "20px";
    icon.style.height = "20px";
    icon.style.marginRight = "8px";
    
    const nameSpan = document.createElement("span");
    nameSpan.textContent = group.name;
    
    nameDiv.appendChild(icon);
    nameDiv.appendChild(nameSpan);
    
    // Right side with controls
    const controls = document.createElement("div");
    controls.className = "action-controls";
    
    // Toggle expand/collapse arrow
    const toggle = document.createElement("span");
    toggle.className = "toggle-indicator";
    toggle.innerHTML = "►";
    toggle.style.marginRight = "8px";
    
    // Action buttons
    const actionBtns = document.createElement("span");
    actionBtns.innerHTML = `
      <button class="action-btn add" title="Add Action">+</button>
      <button class="action-btn edit" title="Edit">✏️</button>
      <button class="action-btn delete" title="Delete">×</button>
    `;
    actionBtns.querySelectorAll('button').forEach(btn => {
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.padding = '0 4px';
    });
    
    controls.appendChild(toggle);
    controls.appendChild(actionBtns);
    
    header.appendChild(nameDiv);
    header.appendChild(controls);
    groupDiv.appendChild(header);
    
    // Content area (collapsed by default)
    const content = document.createElement("div");
    content.className = "action-content";
    content.style.display = "none";
    content.style.borderTop = "1px solid #ccc";
    
    // Add toggle functionality
    header.addEventListener('click', (e) => {
      // Don't toggle if clicked on a button
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      
      if (content.style.display === "none") {
        content.style.display = "block";
        toggle.innerHTML = "▼";
      } else {
        content.style.display = "none";
        toggle.innerHTML = "►";
      }
    });
    
    groupDiv.appendChild(content);
    actionList.appendChild(groupDiv);
  });
  
  tab.appendChild(actionList);
  return tab;
}

function createSkillsTab(actor) {
  const tab = document.createElement("div");
  tab.className = "tab-content";
  tab.dataset.tab = "skills";
  tab.style.display = "none";
  
  // Skills header with purple background
  const header = document.createElement("div");
  header.className = "section-header";
  header.textContent = "Skills";
  header.style.backgroundColor = "#271744";
  header.style.color = "white";
  header.style.padding = "5px 10px";
  header.style.fontWeight = "bold";
  header.style.borderRadius = "3px";
  header.style.marginBottom = "10px";
  
  // Add button
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  addBtn.style.backgroundColor = "#271744";
  addBtn.style.color = "white";
  addBtn.style.border = "none";
  addBtn.style.borderRadius = "3px";
  addBtn.style.padding = "2px 8px";
  addBtn.style.float = "right";
  addBtn.style.cursor = "pointer";
  
  header.appendChild(addBtn);
  tab.appendChild(header);
  
  // Skills table
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  
  // Table header
  const thead = document.createElement("thead");
  thead.style.backgroundColor = "#e0e0d0";
  
  const headerRow = document.createElement("tr");
  const headers = ["Name", "Range", "Target"];
  
  headers.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.padding = "8px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Table body
  const tbody = document.createElement("tbody");
  
  // Get all skills from the actor's items
  const skills = actor.items?.filter(i => i.type === "skill") || [];
  
  skills.forEach(skill => {
    const row = document.createElement("tr");
    row.style.backgroundColor = "#f0f0e0";
    row.style.borderBottom = "1px solid #ddd";
    
    // Name with icon
    const nameCell = document.createElement("td");
    nameCell.style.padding = "8px";
    nameCell.style.display = "flex";
    nameCell.style.alignItems = "center";
    
    const icon = document.createElement("img");
    icon.src = skill.img;
    icon.alt = "";
    icon.style.width = "20px";
    icon.style.height = "20px";
    icon.style.marginRight = "8px";
    
    const nameText = document.createElement("span");
    nameText.textContent = skill.name;
    
    nameCell.appendChild(icon);
    nameCell.appendChild(nameText);
    
    // Range/formula
    const rangeCell = document.createElement("td");
    rangeCell.textContent = skill.system?.features?.formula || "1d20";
    rangeCell.style.padding = "8px";
    
    // Target
    const targetCell = document.createElement("td");
    targetCell.textContent = skill.system?.features?.target || 
                            getSkillTarget(skill, actor);
    targetCell.style.padding = "8px";
    
    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(rangeCell);
    row.appendChild(targetCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  tab.appendChild(table);
  
  return tab;
}

// Helper function to get skill target
function getSkillTarget(skill, actor) {
  // Check for direct target
  if (skill.system?.features?.target) {
    return skill.system.features.target;
  }
  
  // Check for ability-based target
  const ability = skill.system?.features?.ability;
  if (ability && ability !== "none") {
    const abilityValue = actor.system?.abilities?.[ability]?.value || 10;
    return `${ability.charAt(0).toUpperCase() + ability.slice(1)} (${abilityValue})`;
  }
  
  return "10";
}

function createSpellsTab(actor) {
  const tab = document.createElement("div");
  tab.className = "tab-content";
  tab.dataset.tab = "spells";
  tab.style.display = "none";
  
  // Spells header with purple background
  const header = document.createElement("div");
  header.className = "section-header";
  header.textContent = "Spell-Slots-Per-Level";
  header.style.backgroundColor = "#271744";
  header.style.color = "white";
  header.style.padding = "5px 10px";
  header.style.fontWeight = "bold";
  header.style.borderRadius = "3px";
  header.style.marginBottom = "10px";
  
  tab.appendChild(header);
  
  // Spell slots table
  const slotsTable = document.createElement("table");
  slotsTable.style.width = "100%";
  slotsTable.style.borderCollapse = "collapse";
  slotsTable.style.background = "#e8e8d8";
  
  // Create header row with spell levels
  const headerRow = document.createElement("tr");
  
  const typeHeader = document.createElement("th");
  typeHeader.textContent = "Type";
  typeHeader.style.padding = "5px";
  typeHeader.style.textAlign = "left";
  headerRow.appendChild(typeHeader);
  
  const levelHeader = document.createElement("th");
  levelHeader.textContent = "Level";
  levelHeader.style.padding = "5px";
  levelHeader.style.textAlign = "center";
  headerRow.appendChild(levelHeader);
  
  // Add columns for spell levels 0-9
  for (let i = 0; i <= 9; i++) {
    const levelCell = document.createElement("th");
    levelCell.textContent = i;
    levelCell.style.padding = "5px";
    levelCell.style.textAlign = "center";
    headerRow.appendChild(levelCell);
  }
  
  slotsTable.appendChild(headerRow);
  
  // Add rows for arcane and divine spell slots
  const spellTypes = ["Arcane", "Divine"];
  
  spellTypes.forEach(type => {
    const typeRow = document.createElement("tr");
    
    const typeCell = document.createElement("td");
    typeCell.textContent = type;
    typeCell.style.padding = "5px";
    typeCell.style.fontWeight = "bold";
    typeRow.appendChild(typeCell);
    
    // Level cell (caster level)
    const levelCell = document.createElement("td");
    const casterLevel = actor.system?.spellInfo?.level?.[type.toLowerCase()]?.value || 0;
    
    // Create input for caster level
    const levelInput = document.createElement("input");
    levelInput.type = "text";
    levelInput.value = casterLevel;
    levelInput.style.width = "30px";
    levelInput.style.textAlign = "center";
    levelInput.style.padding = "2px";
    levelInput.readOnly = true;
    
    levelCell.appendChild(levelInput);
    levelCell.style.textAlign = "center";
    typeRow.appendChild(levelCell);
    
    // Add cells for spell levels 0-9
    for (let i = 0; i <= 9; i++) {
      const slotCell = document.createElement("td");
      slotCell.style.textAlign = "center";
      
      // Get slot value for this level
      const slotValue = actor.system?.spellInfo?.slots?.[type.toLowerCase()]?.value?.[i] || 0;
      
      // Create input for slot
      const slotInput = document.createElement("input");
      slotInput.type = "text";
      slotInput.value = slotValue;
      slotInput.style.width = "30px";
      slotInput.style.textAlign = "center";
      slotInput.style.padding = "2px";
      slotInput.readOnly = true;
      
      slotCell.appendChild(slotInput);
      typeRow.appendChild(slotCell);
    }
    
    slotsTable.appendChild(typeRow);
  });
  
  tab.appendChild(slotsTable);
  
  // Add memorized spells sections for arcane and divine
  const arcaneMemorized = actor.system?.spellInfo?.memorization?.arcane || {};
  const divineMemorized = actor.system?.spellInfo?.memorization?.divine || {};
  
  // Helper to render memorized spells for a type
  const renderMemorizedSpells = (spells, type) => {
    // Check if there are any spells
    let hasSpells = false;
    for (const level in spells) {
      if (Object.keys(spells[level] || {}).length > 0) {
        hasSpells = true;
        break;
      }
    }
    
    if (!hasSpells) return;
    
    const spellsHeader = document.createElement("h3");
    spellsHeader.textContent = `${type} Spells`;
    spellsHeader.style.marginTop = "20px";
    tab.appendChild(spellsHeader);
    
    // Process each spell level
    for (const level in spells) {
      const levelSpells = spells[level];
      if (!levelSpells || Object.keys(levelSpells).length === 0) continue;
      
      const levelHeader = document.createElement("h4");
      levelHeader.textContent = `Level ${level}`;
      levelHeader.style.marginTop = "10px";
      tab.appendChild(levelHeader);
      
      // Create spell table
      const spellTable = document.createElement("table");
      spellTable.style.width = "100%";
      spellTable.style.borderCollapse = "collapse";
      
      // Create header row
      const headerRow = document.createElement("tr");
      const headers = ["Name", "Status", "School", "Components", "Range", "Duration"];
      
      headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.padding = "5px";
        th.style.textAlign = "left";
        th.style.borderBottom = "1px solid #ccc";
        headerRow.appendChild(th);
      });
      
      spellTable.appendChild(headerRow);
      
      // Add each spell as a row
      Object.values(levelSpells).forEach(spell => {
        if (!spell || !spell.name) return;
        
        const row = document.createElement("tr");
        
        // Name with icon
        const nameCell = document.createElement("td");
        nameCell.style.padding = "5px";
        nameCell.style.display = "flex";
        nameCell.style.alignItems = "center";
        
        const icon = document.createElement("img");
        icon.src = spell.img || "icons/svg/book.svg";
        icon.alt = "";
        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.marginRight = "8px";
        
        const nameText = document.createElement("span");
        nameText.textContent = spell.name;
        
        nameCell.appendChild(icon);
        nameCell.appendChild(nameText);
        
        // Status
        const statusCell = document.createElement("td");
        statusCell.textContent = spell.cast ? "Cast" : "Ready";
        statusCell.style.padding = "5px";
        
        // Get spell details from actor's items if available
        const spellItem = actor.items?.find(i => i.name === spell.name) || {};
        
        // School
        const schoolCell = document.createElement("td");
        schoolCell.textContent = spellItem.system?.school || "-";
        schoolCell.style.padding = "5px";
        
        // Components
        const compCell = document.createElement("td");
        const components = [];
        if (spellItem.system?.components?.verbal) components.push("V");
        if (spellItem.system?.components?.somatic) components.push("S");
        if (spellItem.system?.components?.material) components.push("M");
        compCell.textContent = components.join(", ") || "-";
        compCell.style.padding = "5px";
        
        // Range
        const rangeCell = document.createElement("td");
        rangeCell.textContent = spellItem.system?.range || "-";
        rangeCell.style.padding = "5px";
        
        // Duration
        const durationCell = document.createElement("td");
        durationCell.textContent = spellItem.system?.duration || "-";
        durationCell.style.padding = "5px";
        
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        row.appendChild(schoolCell);
        row.appendChild(compCell);
        row.appendChild(rangeCell);
        row.appendChild(durationCell);
        
        spellTable.appendChild(row);
      });
      
      tab.appendChild(spellTable);
    }
  };
  
  renderMemorizedSpells(arcaneMemorized, "Arcane");
  renderMemorizedSpells(divineMemorized, "Divine");
  
  return tab;
}

function createProficienciesTab(actor) {
  const tab = document.createElement("div");
  tab.className = "tab-content";
  tab.dataset.tab = "proficiencies";
  tab.style.display = "none";
  
  // Proficiency header with purple background
  const header = document.createElement("div");
  header.className = "section-header";
  header.textContent = "Proficiency";
  header.style.backgroundColor = "#271744";
  header.style.color = "white";
  header.style.padding = "5px 10px";
  header.style.fontWeight = "bold";
  header.style.borderRadius = "3px";
  header.style.marginBottom = "10px";
  
  tab.appendChild(header);
  
  // Proficiency summary table
  const profTable = document.createElement("table");
  profTable.style.width = "100%";
  profTable.style.borderCollapse = "collapse";
  profTable.style.background = "#e8e8d8";
  profTable.style.marginBottom = "15px";
  
  // Header row
  const headerRow = document.createElement("tr");
  const headers = ["Penalty", "Weapon", "Non-Weapon", "Class Points"];
  
  headers.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.padding = "8px";
    th.style.textAlign = "center";
    headerRow.appendChild(th);
  });
  
  profTable.appendChild(headerRow);
  
  // Summary row with proficiency counts
  const summaryRow1 = document.createElement("tr");
  
  // Penalty
  const penaltyCell = document.createElement("td");
  penaltyCell.textContent = actor.system?.proficiencies?.penalty || "-2";
  penaltyCell.style.padding = "8px";
  penaltyCell.style.textAlign = "center";
  
  // Weapon obtained
  const weaponCell = document.createElement("td");
  const weaponProfs = actor.items?.filter(i => i.type === "proficiency") || [];
  const weaponCount = weaponProfs.length;
  const weaponMax = actor.system?.proficiencies?.weapon?.starting || 0;
  weaponCell.innerHTML = `Obtained <span>${weaponCount}</span>`;
  weaponCell.style.padding = "8px";
  weaponCell.style.textAlign = "center";
  
  // Non-weapon obtained
  const skillCell = document.createElement("td");
  const skillProfs = actor.items?.filter(i => i.type === "skill") || [];
  const skillCount = skillProfs.length;
  const skillMax = actor.system?.proficiencies?.skill?.starting || 0;
  skillCell.innerHTML = `Obtained <span>${skillCount}</span>`;
  skillCell.style.padding = "8px";
  skillCell.style.textAlign = "center";
  
  // Class points obtained
  const classPointsCell = document.createElement("td");
  classPointsCell.innerHTML = `Obtained <span>0</span>`;
  classPointsCell.style.padding = "8px";
  classPointsCell.style.textAlign = "center";
  
  // Add cells to row
  summaryRow1.appendChild(penaltyCell);
  summaryRow1.appendChild(weaponCell);
  summaryRow1.appendChild(skillCell);
  summaryRow1.appendChild(classPointsCell);
  
  // Used row
  const summaryRow2 = document.createElement("tr");
  
  const emptyCell = document.createElement("td");
  emptyCell.textContent = "";
  
  // Weapon used
  const weaponUsedCell = document.createElement("td");
  const weaponUsed = weaponProfs.filter(p => p.system?.appliedto?.length > 0).length;
  weaponUsedCell.innerHTML = `Used <span>${weaponUsed}</span>`;
  weaponUsedCell.style.padding = "8px";
  weaponUsedCell.style.textAlign = "center";
  
  // Non-weapon used
  const skillUsedCell = document.createElement("td");
  skillUsedCell.innerHTML = `Used <span>${skillCount}</span>`;
  skillUsedCell.style.padding = "8px";
  skillUsedCell.style.textAlign = "center";
  
  // Class points used
  const classPointsUsedCell = document.createElement("td");
  classPointsUsedCell.innerHTML = `Used <span>0</span>`;
  classPointsUsedCell.style.padding = "8px";
  classPointsUsedCell.style.textAlign = "center";
  
  // Add cells to row
  summaryRow2.appendChild(emptyCell);
  summaryRow2.appendChild(weaponUsedCell);
  summaryRow2.appendChild(skillUsedCell);
  summaryRow2.appendChild(classPointsUsedCell);
  
  profTable.appendChild(summaryRow1);
  profTable.appendChild(summaryRow2);
  
  tab.appendChild(profTable);
  
  // Proficiencies list
  const profs = actor.items?.filter(i => i.type === "proficiency") || [];
  
  if (profs.length > 0) {
    const profsHeader = document.createElement("h3");
    profsHeader.textContent = "Weapon Proficiencies";
    tab.appendChild(profsHeader);
    
    const profList = document.createElement("ul");
    profs.forEach(prof => {
      const li = document.createElement("li");
      li.textContent = prof.name;
      profList.appendChild(li);
    });
    
    tab.appendChild(profList);
  }
  
  // Skills list
  const skills = actor.items?.filter(i => i.type === "skill") || [];
  
  if (skills.length > 0) {
    const skillsHeader = document.createElement("h3");
    skillsHeader.textContent = "Non-Weapon Proficiencies";
    skillsHeader.style.marginTop = "20px";
    tab.appendChild(skillsHeader);
    
    const skillList = document.createElement("ul");
    skills.forEach(skill => {
      const li = document.createElement("li");
      li.textContent = skill.name;
      skillList.appendChild(li);
    });
    
    tab.appendChild(skillList);
  }
  
  return tab;
}

// Helper function to format alignment text
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

  
  