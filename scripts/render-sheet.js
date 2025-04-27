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
  
  function calculateArmorClass(actor) {
    console.log(`🔎 Calculating Armor Class for: ${actor.name}`);
  
    let baseAC = 10;
    let armorMagicBonus = 0;
    let shieldACBonus = 0;
    let dexBonus = 0;
    let protectionBonus = 0;
  
    // Step 1: Find equipped armor (MUST be real armor, not ring or cloak!)
    const armor = actor.items?.find(i => 
      i.type === "armor" &&
      i.system?.location?.state === "equipped" &&
      ["armor", "bracers", "warding"].includes((i.system?.protection?.type || "").toLowerCase())
    );
    
    if (armor) {
      const armorBaseAC = armor.system?.protection?.ac ?? 10;
      const armorBonus = armor.system?.protection?.modifier ?? 0;
      baseAC = armorBaseAC;
      armorMagicBonus = armorBonus;
      console.log(`🛡️ Armor found: ${armor.name} (Base AC ${armorBaseAC}, Magic Bonus +${armorBonus})`);
    } else {
      console.log(`⚠️ No body armor equipped.`);
    }
  
    // Step 2: Find shield
    const shield = actor.items?.find(i => 
      (i.type === "armor" || i.type === "equipment") &&
      i.name?.toLowerCase().includes("shield") &&
      i.system?.location?.state === "equipped"
    );
    if (shield) {
      const shieldBonus = shield.system?.protection?.modifier ?? 0;
      shieldACBonus = 1 + shieldBonus;
      console.log(`🛡️ Shield found: ${shield.name} (Base +1 shield bonus, Magic Bonus +${shieldBonus})`);
    } else {
      console.log(`⚠️ No shield equipped.`);
    }
  
    // Step 3: Find protection items (rings/cloaks/etc.)
    const protectionItems = actor.items?.filter(i => {
      const name = i.name?.toLowerCase() || "";
      return (name.includes("ring of protection") || 
              name.includes("cloak of protection") || 
              name.includes("amulet of protection")) &&
             i.system?.location?.state === "equipped";
    }) || [];
  
    if (protectionItems.length > 0) {
      protectionItems.forEach(item => {
        const bonus = item.system?.attributes?.bonus ?? 1;
        protectionBonus += bonus;
        console.log(`💍 Protection item found: ${item.name} (Bonus +${bonus})`);
      });
    } else {
      console.log(`⚠️ No protection items equipped.`);
    }
  
    // Step 4: Real 1st Edition Dexterity bonus
    const dex = actor.system?.abilities?.dex?.value ?? 10;
    if (dex === 3) dexBonus = +4;
    else if (dex === 4) dexBonus = +3;
    else if (dex === 5) dexBonus = +2;
    else if (dex === 6) dexBonus = +1;
    else if (dex >= 7 && dex <= 14) dexBonus = 0;
    else if (dex === 15) dexBonus = -1;
    else if (dex === 16) dexBonus = -2;
    else if (dex === 17) dexBonus = -3;
    else if (dex === 18) dexBonus = -4;
    
    console.log(`🏃 Dexterity score: ${dex} (AC Modifier ${dexBonus >= 0 ? "+" : ""}${dexBonus})`);
  
    // Step 5: Calculate final ACs
    const normal = baseAC - armorMagicBonus - shieldACBonus - protectionBonus + dexBonus;
    const shieldless = baseAC - armorMagicBonus - protectionBonus + dexBonus;
    const rear = baseAC - armorMagicBonus - protectionBonus;
  
    console.log(`🎯 Calculated ACs for ${actor.name}: Normal ${normal}, Shieldless ${shieldless}, Rear ${rear}`);
    console.log(`────────────`);
  
    return {
      normal,
      shieldless,
      rear
    };
  }
  
  function createDetailsTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "details";
    tab.style.display = "none";
    
    // Details header with purple background
    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = "Character Description";
    header.style.backgroundColor = "#271744";
    header.style.color = "white";
    header.style.padding = "5px 10px";
    header.style.fontWeight = "bold";
    header.style.borderRadius = "3px";
    header.style.marginBottom = "10px";
    
    tab.appendChild(header);
    
    // Character Details Grid
    const detailsGrid = document.createElement("div");
    detailsGrid.style.display = "grid";
    detailsGrid.style.gridTemplateColumns = "auto 1fr auto 1fr";
    detailsGrid.style.gap = "10px 20px";
    detailsGrid.style.marginBottom = "20px";
    detailsGrid.style.background = "#f0f0e0";
    detailsGrid.style.padding = "10px";
    detailsGrid.style.borderRadius = "5px";
    
    // First Row: Age and Sex
    addDetailField(detailsGrid, "Age", actor.system?.details?.age || "");
    addDetailField(detailsGrid, "Sex", actor.system?.details?.sex || "");
    
    // Second Row: Height and Weight
    addDetailField(detailsGrid, "Height", actor.system?.details?.height || "");
    addDetailField(detailsGrid, "Weight", actor.system?.details?.weight || "");
    
    // Third Row: Deity and Patron
    addDetailField(detailsGrid, "Deity", actor.system?.details?.deity || "");
    addDetailField(detailsGrid, "Patron", actor.system?.details?.patron || "");
    
    tab.appendChild(detailsGrid);
    
    // Notes Section
    const notesHeader = document.createElement("div");
    notesHeader.className = "section-header";
    notesHeader.textContent = "Notes";
    notesHeader.style.backgroundColor = "#271744";
    notesHeader.style.color = "white";
    notesHeader.style.padding = "5px 10px";
    notesHeader.style.fontWeight = "bold";
    notesHeader.style.borderRadius = "3px";
    notesHeader.style.marginBottom = "10px";
    
    tab.appendChild(notesHeader);
    
    // Biography/Notes content
    const notesContent = document.createElement("div");
    notesContent.style.background = "#f0f0e0";
    notesContent.style.border = "2px solid #c00";
    notesContent.style.padding = "15px";
    notesContent.style.borderRadius = "3px";
    notesContent.style.whiteSpace = "pre-wrap";
    notesContent.style.fontFamily = "monospace";
    notesContent.style.fontSize = "13px";
    notesContent.style.lineHeight = "1.5";
    
    // Parse HTML biography and convert to plain text safely
    let cleanText = "";
    if (actor.system?.details?.biography?.value) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = actor.system.details.biography.value;
      cleanText = tempDiv.textContent || tempDiv.innerText || "";
    }
    
    notesContent.textContent = cleanText;
    
    tab.appendChild(notesContent);
    
    return tab;
  }
  
  // Helper function to add detail fields
  function addDetailField(container, label, value) {
    const labelDiv = document.createElement("div");
    labelDiv.textContent = label;
    labelDiv.style.fontWeight = "bold";
    
    const valueDiv = document.createElement("div");
    if (label === "Age" || label === "Height" || label === "Weight") {
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.style.width = "100px";
      input.style.padding = "4px";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "3px";
      input.readOnly = true;
      valueDiv.appendChild(input);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.style.width = "200px";
      input.style.padding = "4px";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "3px";
      input.readOnly = true;
      valueDiv.appendChild(input);
    }
    
    container.appendChild(labelDiv);
    container.appendChild(valueDiv);
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

    // Apply racial modifiers to get adjusted ability scores
    const modifiedActor = applyRacialModifiers(actor);
    
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
    
    // fallback if the image fails to load
    portraitImg.onerror = function() {
        this.onerror = null; // Prevent infinite loop if backup also fails
        this.src = "icons/svg/item-bag.svg"; // generic backup icon
    };
    
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

    const acValues = calculateArmorClass(actor);

    // 🛡️ Armor and shield info
    const armor = actor.items?.find(i => 
      i.type === "armor" &&
      i.system?.location?.state === "equipped" &&
      ["armor", "bracers", "warding"].includes((i.system?.protection?.type || "").toLowerCase())
    );

    const shield = actor.items?.find(i => 
      (i.type === "armor" || i.type === "equipment") &&
      i.name?.toLowerCase().includes("shield") &&
      i.system?.location?.state === "equipped"
    );

    // Build visible equipment text (multi-line)
    let equipmentLines = [];

    if (armor) {
      const base = armor.system?.protection?.ac ?? "?";
      const mod = armor.system?.protection?.modifier ?? 0;
      equipmentLines.push(`${armor.name} (AC ${base}, +${mod} magic)`);
    } else {
      equipmentLines.push(`No Armor`);
    }

    if (shield) {
      const mod = shield.system?.protection?.modifier ?? 0;
      equipmentLines.push(`${shield.name} (+${1 + mod} AC)`);
    }

    // Find protection items
    const protectionItems = actor.items?.filter(i => {
      const name = i.name?.toLowerCase() || "";
      return (name.includes("ring of protection") ||
              name.includes("cloak of protection") ||
              name.includes("amulet of protection")) &&
            i.system?.location?.state === "equipped";
    }) || [];

    if (protectionItems.length > 0) {
      protectionItems.forEach(item => {
        const bonus = item.system?.attributes?.bonus ?? 1;
        equipmentLines.push(`${item.name} (+${bonus} AC)`);
      });
    }

    // Final display text (multi-line)
    const equipmentText = equipmentLines.join('<br>');

    // Create div under AC showing armor/shield/magic worn
    const equipmentDiv = document.createElement("div");
    equipmentDiv.style.fontSize = "10px";
    equipmentDiv.style.marginTop = "4px";
    equipmentDiv.style.textAlign = "center";
    equipmentDiv.innerHTML = equipmentText || "No Armor";

    // Full hover tooltip with sources
    let tooltip = "";

    if (armor) {
      const base = armor.system?.protection?.ac ?? "?";
      const mod = armor.system?.protection?.modifier ?? 0;
      tooltip += `🛡️ Armor: ${armor.name} (AC ${base}, +${mod} magic)\n`;
    } else {
      tooltip += `🛡️ Armor: None\n`;
    }

    if (shield) {
      const mod = shield.system?.protection?.modifier ?? 0;
      tooltip += `🛡️ Shield: ${shield.name} (+${1 + mod} AC total)\n`;
    } else {
      tooltip += `🛡️ Shield: None\n`;
    }

    // Real DEX adjustment
    const dex = actor.system?.abilities?.dex?.value ?? 10;
    let dexBonus = 0;
    if (dex === 3) dexBonus = +4;
    else if (dex === 4) dexBonus = +3;
    else if (dex === 5) dexBonus = +2;
    else if (dex === 6) dexBonus = +1;
    else if (dex >= 7 && dex <= 14) dexBonus = 0;
    else if (dex === 15) dexBonus = -1;
    else if (dex === 16) dexBonus = -2;
    else if (dex === 17) dexBonus = -3;
    else if (dex === 18) dexBonus = -4;

    tooltip += `🏃 Dex ${dex}: ${dexBonus >= 0 ? "+" : ""}${dexBonus} AC\n`;

    if (protectionItems.length > 0) {
      protectionItems.forEach(item => {
        const bonus = item.system?.attributes?.bonus ?? 1;
        tooltip += `💍 ${item.name} (+${bonus} AC)\n`;
      });
    } else {
      tooltip += `💍 No additional protection items\n`;
    }

    // Attach tooltip to AC value
    acValue.title = tooltip.trim();

    // Create AC number display
    const acNum = document.createElement("div");
    acNum.textContent = acValues.normal;
    acNum.style.fontSize = "24px";
    acNum.style.fontWeight = "bold";

    acValue.appendChild(acLabel);
    acValue.appendChild(acNum);

    // Create shieldless and rear AC rows
    const acDetails = document.createElement("div");
    acDetails.style.display = "flex";
    acDetails.style.flexDirection = "column";

    const shieldlessRow = document.createElement("div");
    shieldlessRow.innerHTML = `<span>Shieldless</span> <span>${acValues.shieldless}</span>`;
    shieldlessRow.style.display = "flex";
    shieldlessRow.style.justifyContent = "space-between";

    const rearRow = document.createElement("div");
    rearRow.innerHTML = `<span>Rear</span> <span>${acValues.rear}</span>`;
    rearRow.style.display = "flex";
    rearRow.style.justifyContent = "space-between";

    acDetails.appendChild(shieldlessRow);
    acDetails.appendChild(rearRow);

    // Add everything to acSection
    acSection.appendChild(acValue);
    acSection.appendChild(equipmentDiv);
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
    
    // Create tab contents
    // Create tab contents - use modifiedActor instead of actor
    const characterTab = createCharacterTab(modifiedActor);
    const matrixTab = createMatrixTab(modifiedActor);
    const weaponsTab = createWeaponsTab(modifiedActor);
    const actionsTab = createActionsTab(modifiedActor);
    const itemsTab = createItemsTab(modifiedActor);
    const skillsTab = createSkillsTab(modifiedActor);
    const spellsTab = createSpellsTab(modifiedActor);
    const proficienciesTab = createProficienciesTab(modifiedActor);
    const detailsTab = createDetailsTab(modifiedActor);
    
    // Add tabs to content area
    contentArea.appendChild(characterTab);
    contentArea.appendChild(matrixTab);
    contentArea.appendChild(weaponsTab);
    contentArea.appendChild(actionsTab);
    contentArea.appendChild(skillsTab);
    contentArea.appendChild(itemsTab); 
    contentArea.appendChild(spellsTab);
    contentArea.appendChild(proficienciesTab);
    contentArea.appendChild(detailsTab);
    
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
    
    // Character Info Grid (Fixed for multiclass correctly)
    const basicInfo = document.createElement("div");
    basicInfo.style.display = "grid";
    basicInfo.style.gridTemplateColumns = "1fr 1fr";
    basicInfo.style.gap = "10px";
    basicInfo.style.marginTop = "10px";

    // ➔ Correct class + levels display
    const classLabel = document.createElement("div");
    classLabel.textContent = "Class";
    classLabel.style.fontWeight = "bold";

    const classValue = document.createElement("div");
    let classDisplay = "Unknown";
    if (actor.activeClasses && Array.isArray(actor.activeClasses)) {
      const classes = actor.activeClasses.map(c => `${c.name} ${c.system?.level ?? "?"}`);
      classDisplay = classes.join(" / ");
    } else if (actor.items) {
      const classItems = actor.items.filter(i => i.type === "class");
      if (classItems.length > 0) {
        const classes = classItems.map(c => `${c.name} ${c.system?.level ?? "?"}`);
        classDisplay = classes.join(" / ");
      }
    }
    classValue.textContent = classDisplay;

    // ➔ Race
    const raceLabel = document.createElement("div");
    raceLabel.textContent = "Race";
    raceLabel.style.fontWeight = "bold";

    const raceValue = document.createElement("div");
    const raceItem = actor.items?.find(i => i.type === "race");
    raceValue.textContent = raceItem?.name || actor.system?.details?.race?.name || "Unknown";

    // ➔ Alignment
    const alignmentLabel = document.createElement("div");
    alignmentLabel.textContent = "Alignment";
    alignmentLabel.style.fontWeight = "bold";

    const alignmentValue = document.createElement("div");
    alignmentValue.textContent = formatAlignment(actor.system?.alignment || actor.system?.details?.alignment || "Unknown");

    // ➔ Background
    const backgroundLabel = document.createElement("div");
    backgroundLabel.textContent = "Background";
    backgroundLabel.style.fontWeight = "bold";

    const backgroundValue = document.createElement("div");
    backgroundValue.textContent = actor.system?.backgroundname || "None";

    // ➔ Size
    const sizeLabel = document.createElement("div");
    sizeLabel.textContent = "Size";
    sizeLabel.style.fontWeight = "bold";

    const sizeValue = document.createElement("div");
    sizeValue.textContent = actor.system?.details?.size || actor.system?.attributes?.size || "Medium";

    // ➔ Add all to grid
    basicInfo.appendChild(classLabel);
    basicInfo.appendChild(classValue);
    basicInfo.appendChild(raceLabel);
    basicInfo.appendChild(raceValue);
    basicInfo.appendChild(alignmentLabel);
    basicInfo.appendChild(alignmentValue);
    basicInfo.appendChild(backgroundLabel);
    basicInfo.appendChild(backgroundValue);
    basicInfo.appendChild(sizeLabel);
    basicInfo.appendChild(sizeValue);

    tab.appendChild(basicInfo);

    
    // ─── Abilities Header ───
    const abilitiesHeader = document.createElement("div");
    abilitiesHeader.textContent = "Abilities";
    abilitiesHeader.style.textAlign = "center";
    abilitiesHeader.style.fontSize = "16px";
    abilitiesHeader.style.fontWeight = "bold";
    abilitiesHeader.style.margin = "10px 0";
    tab.appendChild(abilitiesHeader);

    // ─── Abilities Tables ───
    const abilitiesSection = document.createElement("div");
    abilitiesSection.style.display = "flex";
    abilitiesSection.style.flexDirection = "column";
    abilitiesSection.style.gap = "10px";

    // Special case for STR table with percentile strength
    const strTable = createSTRTable(actor);
    abilitiesSection.appendChild(strTable);

    // DEX Table
    const dexTable = createAbilityTable(actor, "DEX", 
      ["%", "Reaction Adj", "Missile Adj", "Def. Adj"],
      ["0", getReactionAdj(actor), getMissileAdj(actor), getDefAdj(actor)]
    );
    abilitiesSection.appendChild(dexTable);

    // CON Table
    const conTable = createAbilityTable(actor, "CON", 
      ["%", "Hit Points", "System Shock", "Res. Survival", "Poison Adj", "Regeneration"],
      ["0", getHPBonus(actor), getSystemShock(actor), 
      getResurrection(actor), getPoisonAdj(actor), getRegeneration(actor)]
    );
    abilitiesSection.appendChild(conTable);

    // INT Table
    const intTable = createAbilityTable(actor, "INT", 
      ["%", "# Languages", "Spell Level", "Learn Chance", "Max Spells", "Immunity"],
      ["0", getLanguages(actor), getSpellLevel(actor), 
      getLearnChance(actor), getMaxSpells(actor), getSpellImmunity(actor)]
    );
    abilitiesSection.appendChild(intTable);

    // WIS Table
    const wisTable = createAbilityTable(actor, "WIS", 
      ["%", "Magic Adj", "Spell Bonuses", "Spell Failure", "Immunity"],
      ["0", getMagicAdj(actor), getSpellBonuses(actor), 
      getSpellFailure(actor), getWisImmunity(actor)]
    );
    abilitiesSection.appendChild(wisTable);

    // CHA Table
    const chaTable = createAbilityTable(actor, "CHA", 
      ["%", "Max Henchmen", "Loyalty Base", "Reaction Adj"],
      ["0", getMaxHenchmen(actor), getLoyaltyBase(actor), 
      getChaReactionAdj(actor)]
    );
    abilitiesSection.appendChild(chaTable);

    tab.appendChild(abilitiesSection);
    
    // ─── Saves Section ───
    const savesHeader = document.createElement("div");
    savesHeader.textContent = "Saves";
    savesHeader.style.textAlign = "center";
    savesHeader.style.fontSize = "16px";
    savesHeader.style.fontWeight = "bold";
    savesHeader.style.margin = "20px 0 10px 0";
    tab.appendChild(savesHeader);
    
    // Create saves grid with similar styling to the screenshot
    const savesGrid = document.createElement("div");
    savesGrid.style.display = "grid";
    savesGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
    savesGrid.style.gap = "8px";
    savesGrid.style.background = "#e8e8d8";
    savesGrid.style.padding = "10px";
    savesGrid.style.borderRadius = "5px";
    
    // Save types
    const saveTypes = [
      { key: "paralyzation", label: "Para", value: actor.system?.saves?.paralyzation?.value || "7" },
      { key: "poison", label: "Poison", value: actor.system?.saves?.poison?.value || "7" },
      { key: "death", label: "Death", value: actor.system?.saves?.death?.value || "7" },
      { key: "rod", label: "Rod", value: actor.system?.saves?.rod?.value || "11" },
      { key: "staff", label: "Staff", value: actor.system?.saves?.staff?.value || "11" },
      { key: "wand", label: "Wand", value: actor.system?.saves?.wand?.value || "11" },
      { key: "petrification", label: "Petri", value: actor.system?.saves?.petrification?.value || "10" },
      { key: "polymorph", label: "Poly", value: actor.system?.saves?.polymorph?.value || "10" },
      { key: "breath", label: "Breath", value: actor.system?.saves?.breath?.value || "12" },
      { key: "spell", label: "Spell", value: actor.system?.saves?.spell?.value || "12" }
    ];
    
    // Create save boxes
    saveTypes.forEach((save) => {
      const saveBox = document.createElement("div");
      saveBox.style.border = "1px solid #ccc";
      saveBox.style.borderRadius = "4px";
      saveBox.style.padding = "5px";
      saveBox.style.textAlign = "center";
      saveBox.style.background = "#f0f0e8";
      
      const saveName = document.createElement("div");
      saveName.textContent = save.label;
      saveName.style.fontWeight = "bold";
      saveName.style.fontSize = "12px";
      saveName.style.marginBottom = "5px";
      
      const saveValue = document.createElement("div");
      saveValue.textContent = save.value;
      saveValue.style.fontSize = "18px";
      saveValue.style.borderRadius = "50%";
      saveValue.style.width = "30px";
      saveValue.style.height = "30px";
      saveValue.style.display = "flex";
      saveValue.style.alignItems = "center";
      saveValue.style.justifyContent = "center";
      saveValue.style.margin = "0 auto";
      saveValue.style.background = "#ddd";
      saveValue.style.fontWeight = "bold";
      
      saveBox.appendChild(saveName);
      saveBox.appendChild(saveValue);
      savesGrid.appendChild(saveBox);
    });
    
    tab.appendChild(savesGrid);
    
    // Items checkbox at bottom
    const itemsBox = document.createElement("div");
    itemsBox.style.display = "flex";
    itemsBox.style.alignItems = "center";
    itemsBox.style.justifyContent = "center";
    itemsBox.style.marginTop = "20px";
    itemsBox.style.background = "#e8e8d8";
    itemsBox.style.padding = "8px";
    itemsBox.style.borderRadius = "5px";
    
    const itemsCheck = document.createElement("div");
    itemsCheck.innerHTML = "✓ Items";
    itemsCheck.style.fontWeight = "bold";
    
    itemsBox.appendChild(itemsCheck);
    tab.appendChild(itemsBox);
    
    return tab;
  }
  
  // Helper function to create ability tables that match the ARS style
  function createAbilityTable(actor, abilKey, headers, values) {
    const abilities = actor.system?.abilities || {};
    const abilityValue = abilities[abilKey.toLowerCase()]?.value || 10;

    // Get the original actor's ability score (without racial modifiers)
    const originalAbilityValue = actor.system?.abilities?.[abilKey.toLowerCase()]?.value || 10;
    
    // Calculate the racial modifier
    const racialMod = abilityValue - originalAbilityValue;
    
    // Create table container
    const tableContainer = document.createElement("div");
    tableContainer.style.marginBottom = "8px";
    
    // Create the table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.border = "1px solid #aaa";
    table.style.background = "#e0e0e0";
    
    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // First header cell is empty (where ability name and value will go)
    const firstHeader = document.createElement("th");
    firstHeader.style.width = "60px";
    firstHeader.style.padding = "4px";
    firstHeader.style.borderBottom = "1px solid #aaa";
    headerRow.appendChild(firstHeader);
    
    // Add the rest of the headers
    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.padding = "4px";
      th.style.fontSize = "12px";
      th.style.fontWeight = "bold";
      th.style.borderBottom = "1px solid #aaa";
      th.style.textAlign = "center";
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create value row
    const tbody = document.createElement("tbody");
    const valueRow = document.createElement("tr");
    valueRow.style.background = "#f8f8f0";
    
    // First cell contains ability name and value
    const abilityCell = document.createElement("td");
    abilityCell.style.padding = "6px";
    abilityCell.style.textAlign = "center";
    abilityCell.style.border = "1px solid #ccc";
    abilityCell.style.fontWeight = "bold";
    abilityCell.style.fontSize = "20px";
    abilityCell.style.background = "#f0e6d2";
    
    // Create ability name and value display
    const abilityDisplay = document.createElement("div");
    abilityDisplay.textContent = abilKey;
    abilityDisplay.style.fontWeight = "bold";
    abilityDisplay.style.fontSize = "12px";
    
    // When displaying the ability value, show the base value and racial modifier
    const valueDisplay = document.createElement("div");
    if (racialMod !== 0) {
      valueDisplay.innerHTML = `${abilityValue} <span style="font-size: 12px; color: ${racialMod > 0 ? 'green' : 'red'};">(${racialMod > 0 ? '+' : ''}${racialMod})</span>`;
    } else {
      valueDisplay.textContent = abilityValue;
    }
    valueDisplay.style.fontSize = "20px";
    valueDisplay.style.fontWeight = "bold";
    
    abilityCell.appendChild(abilityDisplay);
    abilityCell.appendChild(valueDisplay);
    valueRow.appendChild(abilityCell);
    
    // Add the rest of the values
    for (let i = 0; i < values.length; i++) {
      const td = document.createElement("td");
      td.textContent = values[i];
      td.style.padding = "4px";
      td.style.textAlign = "center";
      td.style.border = "1px solid #ccc";
      td.style.fontSize = "13px";
      valueRow.appendChild(td);
    }
    
    tbody.appendChild(valueRow);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    return tableContainer;
  }

  // Special case for STR with percentile strength
  function createSTRTable(actor) {
    const abilities = actor.system?.abilities || {};
    const strValue = abilities.str?.value || 10;
    const strPercent = abilities.str?.percent || 0;
    
    // Create table container
    const tableContainer = document.createElement("div");
    tableContainer.style.marginBottom = "8px";
    
    // Create the table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.border = "1px solid #aaa";
    table.style.background = "#e0e0e0";
    
    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // First header cell is empty
    const firstHeader = document.createElement("th");
    firstHeader.style.width = "60px";
    firstHeader.style.padding = "4px";
    firstHeader.style.borderBottom = "1px solid #aaa";
    headerRow.appendChild(firstHeader);
    
    // Percent header
    const percentHeader = document.createElement("th");
    percentHeader.textContent = "%";
    percentHeader.style.padding = "4px";
    percentHeader.style.fontSize = "12px";
    percentHeader.style.fontWeight = "bold";
    percentHeader.style.borderBottom = "1px solid #aaa";
    percentHeader.style.textAlign = "center";
    headerRow.appendChild(percentHeader);
    
    // Other headers for STR
    const headers = ["Hit Adj", "Damage Adj", "Carry", "Open Doors", "Bend Bars"];
    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.padding = "4px";
      th.style.fontSize = "12px";
      th.style.fontWeight = "bold";
      th.style.borderBottom = "1px solid #aaa";
      th.style.textAlign = "center";
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create value row
    const tbody = document.createElement("tbody");
    const valueRow = document.createElement("tr");
    valueRow.style.background = "#f8f8f0";
    
    // First cell contains STR name and value
    const strCell = document.createElement("td");
    strCell.style.padding = "6px";
    strCell.style.textAlign = "center";
    strCell.style.border = "1px solid #ccc";
    strCell.style.fontWeight = "bold";
    strCell.style.fontSize = "20px";
    strCell.style.background = "#f0e6d2";
    
    // Create STR name and value display
    const strNameDisplay = document.createElement("div");
    strNameDisplay.textContent = "STR";
    strNameDisplay.style.fontWeight = "bold";
    strNameDisplay.style.fontSize = "12px";
    
    const strValueDisplay = document.createElement("div");
    strValueDisplay.textContent = strValue;
    strValueDisplay.style.fontSize = "20px";
    strValueDisplay.style.fontWeight = "bold";
    
    strCell.appendChild(strNameDisplay);
    strCell.appendChild(strValueDisplay);
    valueRow.appendChild(strCell);
    
    // Percent cell
    const percentCell = document.createElement("td");
    if (strValue === 18 && strPercent > 0) {
      percentCell.textContent = `${strPercent}%`;  // add % sign automatically
    } else {
      percentCell.textContent = "";
    }
    
    percentCell.style.padding = "4px";
    percentCell.style.textAlign = "center";
    percentCell.style.border = "1px solid #ccc";
    percentCell.style.fontSize = "13px";
    valueRow.appendChild(percentCell);
    
    // Other STR modifiers
    const modifiers = [
      getHitAdj(actor),
      getDamageAdj(actor),
      getCarryWeight(actor),
      getOpenDoors(actor),
      getBendBars(actor)
    ];
    
    modifiers.forEach(value => {
      const td = document.createElement("td");
      td.textContent = value;
      td.style.padding = "4px";
      td.style.textAlign = "center";
      td.style.border = "1px solid #ccc";
      td.style.fontSize = "13px";
      valueRow.appendChild(td);
    });
    
    tbody.appendChild(valueRow);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    return tableContainer;
  }
  
  // Helper functions to get ability bonuses based on ability scores
  function getPercent(actor, ability) {
    if (ability === "str") {
      return actor.system?.abilities?.strExceptional || "0";
    }
    return "0";
  }

  function getSTRKey(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.percent || 0;
    
    if (str < 18) return str;           // 3–17 → normal STR score lookup
    if (str === 18) {
      if (pct === 0) return 18;          // plain 18, no exceptional strength
      if (pct <= 50) return "18/01-50";
      if (pct <= 75) return "18/51-75";
      if (pct <= 90) return "18/76-90";
      if (pct <= 99) return "18/91-99";
      return "18/00";                    // 18/00
    }
    return str;                          // 19–25 → no % check, direct lookup
  }
  
  
  function getHitAdj(actor) {
    const key = getSTRKey(actor);
    const entry = STRENGTH_TABLE[key];
    return entry ? (entry.hitBonus >= 0 ? `+${entry.hitBonus}` : `${entry.hitBonus}`) : "0";
  }
  
  function getDamageAdj(actor) {
    const key = getSTRKey(actor);
    const entry = STRENGTH_TABLE[key];
    return entry ? (entry.dmgBonus >= 0 ? `+${entry.dmgBonus}` : `${entry.dmgBonus}`) : "0";
  }
  
  function getCarryWeight(actor) {
    const key = getSTRKey(actor);
    const entry = STRENGTH_TABLE[key];
    return entry ? `${entry.weightAllowance}` : "0";
  }
  
  function getOpenDoors(actor) {
    const key = getSTRKey(actor);
    const entry = STRENGTH_TABLE[key];
    return entry ? entry.openDoors : "1/6";
  }
  
  function getBendBars(actor) {
    const key = getSTRKey(actor);
    const entry = STRENGTH_TABLE[key];
    return entry ? entry.bendBars : "0%";
  }
  
  function getReactionAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    const entry = DEXTERITY_TABLE[dex];
    return entry ? entry.reactionAdj : "0";
  }
  
  function getMissileAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    const entry = DEXTERITY_TABLE[dex];
    return entry ? entry.missileAdj : "0";
  }
  
  function getDefAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    const entry = DEXTERITY_TABLE[dex];
    return entry ? entry.defensiveAdj : "0";
  }

  function getHPBonus(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    const entry = CONSTITUTION_TABLE[con];
    return entry ? entry.hpAdj : "0";
  }
  
  function getSystemShock(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    const entry = CONSTITUTION_TABLE[con];
    return entry ? entry.systemShock : "0%";
  }
  
  function getResurrection(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    const entry = CONSTITUTION_TABLE[con];
    return entry ? entry.resurrection : "0%";
  }
  
  function getRegeneration(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    const entry = CONSTITUTION_TABLE[con];
    return entry?.regeneration || "None";
  }

  function getPoisonAdj(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    return (con >= 19) ? "+1" : "0";
  }
  
  function getLanguages(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    const entry = INTELLIGENCE_TABLE[int];
    return entry ? `${entry.languages}` : "0";
  }
  
  function getSpellLevel(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    const entry = INTELLIGENCE_TABLE[int];
    return entry ? `${entry.spellLevelLimit}` : "None";
  }
  
  function getLearnChance(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    const entry = INTELLIGENCE_TABLE[int];
    return entry ? `${entry.learnSpellChance}` : "0%";
  }
  
  function getMaxSpells(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    const entry = INTELLIGENCE_TABLE[int];
    return entry ? `${entry.maxSpellsPerLevel}` : "0";
  }
  
  function getSpellImmunity(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    const entry = INTELLIGENCE_TABLE[int];
    return entry?.Immunity || "None";
  }

  function getMagicAdj(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    const entry = WISDOM_TABLE[wis];
    return entry ? `${entry.magicDefenseAdj}` : "0";
  }
  
  function getSpellBonuses(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    const entry = WISDOM_TABLE[wis];
    return entry ? `${entry.bonusSpells}` : "None";
  }
  
  function getSpellFailure(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    const entry = WISDOM_TABLE[wis];
    return entry ? `${entry.spellFailureChance}` : "0%";
  }
  
  function getWisImmunity(actor) {
    // You have no Immunity defined for Wisdom in your table, just return None
    return "None";
  }
  
  function getMaxHenchmen(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    const entry = CHARISMA_TABLE[cha];
    return entry ? `${entry.maxHenchmen}` : "0";
  }
  
  function getLoyaltyBase(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    const entry = CHARISMA_TABLE[cha];
    return entry ? `${entry.loyaltyBase}` : "0%";
  }
  
  function getChaReactionAdj(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    const entry = CHARISMA_TABLE[cha];
    return entry ? `${entry.reactionAdj}` : "0%";
  }
  
  
  /* function getHitAdj(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.exceptional || 0;
    
    if (str === 3) return "-3";
    if (str <= 5) return "-2";
    if (str <= 7) return "-1";
    if (str <= 15) return "0";
    if (str === 16) return "0";
    if (str === 17) return "+1";
    if (str === 18) {
      if (pct === 0) return "+1";
      if (pct <= 50) return "+1";
      if (pct <= 75) return "+2";
      if (pct <= 99) return "+2";
      return "+3"; // 18/00
    }
    return "+3"; // 19+
  }
  
  function getDamageAdj(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.exceptional || 0;
  
    if (str === 3) return "-1";
    if (str <= 5) return "-1";
    if (str <= 7) return "0";
    if (str <= 15) return "0";
    if (str === 16) return "+1";
    if (str === 17) return "+1";
    if (str === 18) {
      if (pct === 0) return "+2";
      if (pct <= 50) return "+3";
      if (pct <= 75) return "+3";
      if (pct <= 90) return "+4";
      if (pct <= 99) return "+5";
      return "+6"; // 18/00
    }
    return "+6"; // 19+
  }
  
  function getCarryWeight(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.exceptional || 0;
  
    if (str === 3) return "-350";
    if (str <= 5) return "-250";
    if (str <= 7) return "-150";
    if (str <= 11) return "normal";
    if (str === 12) return "+100";
    if (str === 13) return "+100";
    if (str === 14) return "+200";
    if (str === 15) return "+200";
    if (str === 16) return "+350";
    if (str === 17) return "+500";
    if (str === 18) {
      if (pct === 0) return "+750";
      if (pct <= 50) return "+1000";
      if (pct <= 75) return "+1250";
      if (pct <= 90) return "+1500";
      if (pct <= 99) return "+2000";
      return "+3000"; // 18/00
    }
    return "+3000"; // 19+
  }
  
  function getOpenDoors(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.exceptional || 0;
  
    if (str <= 7) return "1";
    if (str <= 15) return "1-2";
    if (str === 16) return "1-2";
    if (str === 17) return "1-3";
    if (str === 18) {
      if (pct === 0) return "1-3";
      if (pct <= 75) return "1-3";
      if (pct <= 90) return "1-4";
      if (pct <= 99) return "1-4 (1)";
      return "1-5 (2)"; // 18/00
    }
    return "1-5 (2)"; // 19+
  }
  
  function getBendBars(actor) {
    const str = actor.system?.abilities?.str?.value || 10;
    const pct = actor.system?.abilities?.str?.exceptional || 0;
  
    if (str === 3) return "0%";
    if (str <= 5) return "0%";
    if (str === 6) return "0%";
    if (str === 7) return "0%";
    if (str === 8) return "1%";
    if (str === 9) return "1%";
    if (str === 10) return "2%";
    if (str === 11) return "2%";
    if (str === 12) return "4%";
    if (str === 13) return "4%";
    if (str === 14) return "7%";
    if (str === 15) return "7%";
    if (str === 16) return "10%";
    if (str === 17) return "13%";
    if (str === 18) {
      if (pct === 0) return "16%";
      if (pct <= 50) return "20%";
      if (pct <= 75) return "25%";
      if (pct <= 90) return "30%";
      if (pct <= 99) return "35%";
      return "40%"; // 18/00
    }
    return "40%"; // 19+
  }
   */
  
  /* // Similar helper functions for other abilities
  function getReactionAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    if (dex <= 5) return "-2";
    if (dex <= 7) return "-1";
    if (dex <= 12) return "0";
    if (dex <= 14) return "1";
    if (dex <= 16) return "2";
    return "3"; // Dex 17+
  }
  
  function getMissileAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    if (dex <= 5) return "-2";
    if (dex <= 7) return "-1";
    if (dex <= 12) return "0";
    if (dex <= 14) return "1";
    if (dex <= 16) return "2";
    return "3"; // Dex 17+
  }
  
  function getDefAdj(actor) {
    const dex = actor.system?.abilities?.dex?.value || 10;
    if (dex === 3) return "+4";
    if (dex === 4) return "+3";
    if (dex === 5) return "+2";
    if (dex === 6) return "+1";
    if (dex <= 14) return "0";
    if (dex === 15) return "-1";
    if (dex === 16) return "-2";
    if (dex === 17) return "-3";
    return "-4"; // Dex 18+
  }
  
  function getHPBonus(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    if (con === 3) return "-2";
    if (con <= 6) return "-1";
    if (con <= 12) return "0";
    if (con <= 15) return "1";
    if (con <= 17) return "2";
    return "2,5"; // Con 18+
  }
  
  function getSystemShock(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    if (con === 3) return "35%";
    if (con === 4) return "40%";
    if (con === 5) return "45%";
    if (con === 6) return "50%";
    if (con === 7) return "55%";
    if (con === 8) return "60%";
    if (con === 9) return "65%";
    if (con === 10) return "70%";
    if (con === 11) return "75%";
    if (con === 12) return "80%";
    if (con === 13) return "85%";
    if (con === 14) return "88%";
    if (con === 15) return "90%";
    if (con === 16) return "95%";
    if (con === 17) return "97%";
    return "99%"; // Con 18+
  }
  
  function getResurrection(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    if (con === 3) return "40%";
    if (con === 4) return "45%";
    if (con === 5) return "50%";
    if (con === 6) return "55%";
    if (con === 7) return "60%";
    if (con === 8) return "65%";
    if (con === 9) return "70%";
    if (con === 10) return "75%";
    if (con === 11) return "80%";
    if (con === 12) return "85%";
    if (con === 13) return "90%";
    if (con === 14) return "92%";
    if (con === 15) return "94%";
    if (con === 16) return "96%";
    if (con === 17) return "98%";
    return "100%"; // Con 18+
  }
  
  function getPoisonAdj(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    if (con <= 12) return "0";
    if (con <= 17) return "0";
    return "1"; // Con 18+
  }
  
  function getRegeneration(actor) {
    const con = actor.system?.abilities?.con?.value || 10;
    if (con <= 18) return "None";
    return "1/6 turns"; // Con 19+
  }
  
  function getLanguages(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    if (int <= 7) return "1";
    if (int <= 10) return "2";
    if (int <= 14) return "3";
    if (int <= 16) return "4";
    return "2"; // Default
  }
  
  function getSpellLevel(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    if (int <= 12) return "5";
    if (int <= 14) return "6";
    if (int <= 16) return "7";
    return "5"; // Default
  }
  
  function getLearnChance(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    if (int <= 8) return "0%";
    if (int === 9) return "35%";
    if (int === 10) return "40%";
    if (int === 11) return "45%";
    if (int === 12) return "50%";
    if (int === 13) return "55%";
    if (int === 14) return "60%";
    if (int === 15) return "65%";
    if (int === 16) return "70%";
    if (int === 17) return "75%";
    return "40%"; // Default
  }
  
  function getMaxSpells(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    if (int <= 9) return "6";
    if (int <= 12) return "7";
    if (int <= 14) return "9";
    if (int <= 16) return "11";
    return "7"; // Default
  }
  
  function getSpellImmunity(actor) {
    const int = actor.system?.abilities?.int?.value || 10;
    return "None"; // Default
  }
  
  function getMagicAdj(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    if (wis === 3) return "-3";
    if (wis <= 5) return "-2";
    if (wis <= 7) return "-1";
    if (wis <= 14) return "0";
    if (wis === 15) return "+1";
    if (wis === 16) return "+2";
    if (wis === 17) return "+3";
    return "3"; // Default
  }
  
  function getSpellBonuses(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    if (wis <= 12) return "None";
    if (wis === 13) return "None";
    if (wis === 14) return "1 x 1st";
    if (wis === 15) return "1 x 2nd";
    if (wis === 16) return "1 x 2nd + 1 x 1st";
    if (wis === 17) return "1 x 3rd + 1 x 2nd";
    return "Various"; // Default for high wisdom
  }
  
  function getSpellFailure(actor) {
    const wis = actor.system?.abilities?.wis?.value || 10;
    if (wis === 3) return "80%";
    if (wis === 4) return "60%";
    if (wis === 5) return "50%";
    if (wis === 6) return "40%";
    if (wis === 7) return "30%";
    if (wis <= 9) return "20%";
    if (wis === 10) return "15%";
    if (wis === 11) return "10%";
    if (wis === 12) return "5%";
    return "0%"; // Wis 13+
  }
  
  function getWisImmunity(actor) {
    return "None"; // Default
  }
  
  function getMaxHenchmen(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    if (cha === 3) return "1";
    if (cha <= 6) return "2";
    if (cha === 7) return "3";
    if (cha <= 11) return "4";
    if (cha <= 12) return "5";
    if (cha === 13) return "5";
    if (cha === 14) return "6";
    if (cha === 15) return "7";
    if (cha === 16) return "8";
    if (cha === 17) return "10";
    return "4"; // Default
  }
  
  function getLoyaltyBase(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    if (cha === 3) return "-8";
    if (cha === 4) return "-7";
    if (cha === 5) return "-6";
    if (cha === 6) return "-5";
    if (cha === 7) return "-4";
    if (cha === 8) return "-3";
    if (cha === 9) return "-2";
    if (cha === 10) return "-1";
    if (cha === 11) return "0";
    if (cha === 12) return "0";
    if (cha === 13) return "+1";
    if (cha === 14) return "+2";
    if (cha === 15) return "+3";
    if (cha === 16) return "+4";
    if (cha === 17) return "+5";
    return "0"; // Default
  }
  
  function getChaReactionAdj(actor) {
    const cha = actor.system?.abilities?.cha?.value || 10;
    if (cha === 3) return "-7";
    if (cha === 4) return "-6";
    if (cha === 5) return "-5";
    if (cha === 6) return "-4";
    if (cha === 7) return "-3";
    if (cha === 8) return "-2";
    if (cha === 9) return "-1";
    if (cha <= 11) return "0";
    if (cha === 12) return "+1";
    if (cha === 13) return "+1";
    if (cha === 14) return "+2";
    if (cha === 15) return "+3";
    if (cha === 16) return "+4";
    if (cha === 17) return "+5";
    return "0"; // Default
  } */
  
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
        contIcon.src = container.img || "icons/svg/item-bag.svg"; // fallback if missing initially
        contIcon.alt = container.name || "";
        contIcon.style.width = "24px";
        contIcon.style.height = "24px";
        contIcon.style.marginRight = "10px";

        // Add fallback for broken container images
        contIcon.onerror = function() {
            this.onerror = null;
            this.src = "icons/svg/item-bag.svg";
        };
        
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
          const img = document.createElement("img");
          img.src = item.img || "icons/svg/item-bag.svg";
          img.alt = item.name || "";
          img.style.width = "16px";
          img.style.height = "16px";
          img.style.marginRight = "5px";

          // fallback if image fails
          img.onerror = function() {
              this.onerror = null;
              this.src = "icons/svg/item-bag.svg";
          };

          li.appendChild(img);
          li.appendChild(document.createTextNode(` ${item.name} (${item.quantity || 1})`));
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
        img.src = item.img || "icons/svg/item-bag.svg"; // default if missing
        img.alt = "";
        img.style.width = "20px";
        img.style.height = "20px";

        // 🛡️ fallback if loading fails (404)
        img.onerror = function() {
            this.onerror = null; // Prevent infinite loop if backup fails
            this.src = "icons/svg/item-bag.svg"; // fallback image
        };

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
  //const itemsTab = createItemsTab(actor);
  //contentArea.appendChild(itemsTab);
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
    const itemsWithActions = actor.items 
      ? actor.items.filter(i => i.actions && i.actions.length > 0)
      : [];
    
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
        const validChars = newChars.filter(c => c && c.name);
        const updated = [...stored, ...validChars];

        console.log("🧙 Uploaded characters:", validChars.map(c => c.name));
        console.log("📦 Saving characters to localStorage:", updated.map(c => c.name));

        saveStoredCharacters(updated);
        
        // Clear existing content first
        const characterTabs = document.getElementById("character-tabs");
        const characterContents = document.getElementById("character-contents");
        
        if (characterTabs) characterTabs.innerHTML = "";
        if (characterContents) characterContents.innerHTML = "";
        
        // Render all characters
        updated.forEach(renderCharacterSheet);
      });
    });
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
      if (!parent) return;  // 🛡️ Safety guard

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

  const STRENGTH_TABLE = {
    3:  { hitBonus: -3, dmgBonus: -1, weightAllowance: -350, openDoors: "1/6", bendBars: "0%" },
    4:  { hitBonus: -2, dmgBonus: -1, weightAllowance: -250, openDoors: "1/6", bendBars: "0%" },
    5:  { hitBonus: -2, dmgBonus: -1, weightAllowance: -250, openDoors: "1/6", bendBars: "0%" },
    6:  { hitBonus: -1, dmgBonus: 0,  weightAllowance: -150, openDoors: "1/6", bendBars: "0%" },
    7:  { hitBonus: -1, dmgBonus: 0,  weightAllowance: -150, openDoors: "1/6", bendBars: "0%" },
    8:  { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 0, openDoors: "2/6", bendBars: "1%" },
    9:  { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 0, openDoors: "2/6", bendBars: "1%" },
    10: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 0, openDoors: "2/6", bendBars: "2%" },
    11: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 0, openDoors: "2/6", bendBars: "2%" },
    12: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 100, openDoors: "2/6", bendBars: "4%" },
    13: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 100, openDoors: "2/6", bendBars: "4%" },
    14: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 200, openDoors: "2/6", bendBars: "7%" },
    15: { hitBonus: 0,  dmgBonus: 0,  weightAllowance: 200, openDoors: "2/6", bendBars: "7%" },
    16: { hitBonus: 0,  dmgBonus: 1,  weightAllowance: 350, openDoors: "3/6", bendBars: "10%" },
    17: { hitBonus: 1,  dmgBonus: 1,  weightAllowance: 500, openDoors: "3/6", bendBars: "13%" },
    18: { hitBonus: 1,  dmgBonus: 2,  weightAllowance: 750, openDoors: "3/6", bendBars: "16%" },
    "18/01-50": { hitBonus: 1, dmgBonus: 3, weightAllowance: 1000, openDoors: "3/6", bendBars: "20%" },
    "18/51-75": { hitBonus: 2, dmgBonus: 3, weightAllowance: 1250, openDoors: "4/6", bendBars: "25%" },
    "18/76-90": { hitBonus: 2, dmgBonus: 4, weightAllowance: 1500, openDoors: "4/6", bendBars: "30%" },
    "18/91-99": { hitBonus: 2, dmgBonus: 5, weightAllowance: 2000, openDoors: "4/6(1)*", bendBars: "35%" },
    "18/00":    { hitBonus: 3, dmgBonus: 6, weightAllowance: 3000, openDoors: "5/6(2)*", bendBars: "40%" },
    19: { hitBonus: 3, dmgBonus: 7, weightAllowance: 4500, openDoors: "7 in 8 (3)", bendBars: "50%" },
    20: { hitBonus: 3, dmgBonus: 8, weightAllowance: 5000, openDoors: "7 in 8 (3)", bendBars: "60%" },
    21: { hitBonus: 4, dmgBonus: 9, weightAllowance: 6000, openDoors: "9 in 10 (4)", bendBars: "70%" },
    22: { hitBonus: 4, dmgBonus: 10, weightAllowance: 7500, openDoors: "11 in 12 (4)", bendBars: "80%" },
    23: { hitBonus: 5, dmgBonus: 11, weightAllowance: 9000, openDoors: "11 in 12 (5)", bendBars: "90%" },
    24: { hitBonus: 6, dmgBonus: 12, weightAllowance: 12000, openDoors: "19 in 20 (7 in 8)", bendBars: "100%" },
    25: { hitBonus: 7, dmgBonus: 14, weightAllowance: 15000, openDoors: "23 in 24 (9 in 10)", bendBars: "100%" }
  };

  const INTELLIGENCE_TABLE = {
    3: { languages: 0, literacy: "Illiterate", spellLevelLimit: "None", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    4: { languages: 0, literacy: "Illiterate", spellLevelLimit: "None", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    5: { languages: 0, literacy: "Illiterate", spellLevelLimit: "None", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    6: { languages: 0, literacy: "Illiterate", spellLevelLimit: "None", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    7: { languages: 0, literacy: "Literate", spellLevelLimit: "3rd", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    8: { languages: 1, literacy: "Literate", spellLevelLimit: "3rd", learnSpellChance: "0%", maxSpellsPerLevel: 0 },
    9: { languages: 1, literacy: "Literate", spellLevelLimit: "4th", learnSpellChance: "35%", maxSpellsPerLevel: 6 },
    10: { languages: 2, literacy: "Literate", spellLevelLimit: "4th", learnSpellChance: "45%", maxSpellsPerLevel: 7 },
    11: { languages: 2, literacy: "Literate", spellLevelLimit: "5th", learnSpellChance: "45%", maxSpellsPerLevel: 7 },
    12: { languages: 3, literacy: "Literate", spellLevelLimit: "5th", learnSpellChance: "45%", maxSpellsPerLevel: 7 },
    13: { languages: 3, literacy: "Literate", spellLevelLimit: "6th", learnSpellChance: "55%", maxSpellsPerLevel: 9 },
    14: { languages: 4, literacy: "Literate", spellLevelLimit: "6th", learnSpellChance: "55%", maxSpellsPerLevel: 9 },
    15: { languages: 4, literacy: "Literate", spellLevelLimit: "7th", learnSpellChance: "65%", maxSpellsPerLevel: 11 },
    16: { languages: 5, literacy: "Literate", spellLevelLimit: "7th", learnSpellChance: "65%", maxSpellsPerLevel: 11 },
    17: { languages: 6, literacy: "Literate", spellLevelLimit: "8th", learnSpellChance: "75%", maxSpellsPerLevel: 14 },
    18: { languages: 7, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "85%", maxSpellsPerLevel: 18 },
    19: { languages: 8, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "95%", maxSpellsPerLevel: "All", Immunity: "first level illusion/phantasm spells"},
    20: { languages: 9, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "96%", maxSpellsPerLevel: "All", Immunity: "second level illusion/phantasm spells"},
    21: { languages: 10, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "97%", maxSpellsPerLevel: "All", Immunity: "third level illusion/phantasm spells"},
    22: { languages: 11, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "98%", maxSpellsPerLevel: "All", Immunity: "fourth level illusion/phantasm spells"},
    23: { languages: 12, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "99%", maxSpellsPerLevel: "All", Immunity: "fifth level illusion/phantasm spells"},
    24: { languages: 13, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "100%", maxSpellsPerLevel: "All", Immunity: "sixth level illusion/phantasm spells"},
    25: { languages: 14, literacy: "Literate", spellLevelLimit: "9th", learnSpellChance: "100%", maxSpellsPerLevel: "All", Immunity: "seventh level illusion/phantasm spells"}
  };
  
  const WISDOM_TABLE = {
    3: { magicDefenseAdj: "-3", bonusSpells: "None", spellFailureChance: "80%" },
    4: { magicDefenseAdj: "-2", bonusSpells: "None", spellFailureChance: "60%" },
    5: { magicDefenseAdj: "-1", bonusSpells: "None", spellFailureChance: "50%" },
    6: { magicDefenseAdj: "-1", bonusSpells: "None", spellFailureChance: "40%" },
    7: { magicDefenseAdj: "-1", bonusSpells: "None", spellFailureChance: "30%" },
    8: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "20%" },
    9: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "20%" },
    10: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "15%" },
    11: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "10%" },
    12: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "5%" },
    13: { magicDefenseAdj: "0", bonusSpells: "None", spellFailureChance: "0%" },
    14: { magicDefenseAdj: "0", bonusSpells: "1 x 1st", spellFailureChance: "0%" },
    15: { magicDefenseAdj: "+1", bonusSpells: "1 x 2nd", spellFailureChance: "0%" },
    16: { magicDefenseAdj: "+2", bonusSpells: "1 x 2nd + 1 x 1st", spellFailureChance: "0%" },
    17: { magicDefenseAdj: "+3", bonusSpells: "1 x 3rd + 1 x 2nd + 1 x 1st", spellFailureChance: "0%" },
    18: { magicDefenseAdj: "+4", bonusSpells: "2 x 1st + 2 x 2nd + 1 x 3rd", spellFailureChance: "0%" }
  };

  const DEXTERITY_TABLE = {
    3:  { reactionAdj: "-3", missileAdj: "-3", defensiveAdj: "+4" },
    4:  { reactionAdj: "-2", missileAdj: "-2", defensiveAdj: "+3" },
    5:  { reactionAdj: "-2", missileAdj: "-2", defensiveAdj: "+2" },
    6:  { reactionAdj: "-1", missileAdj: "-1", defensiveAdj: "+1" },
    7:  { reactionAdj: "-1", missileAdj: "-1", defensiveAdj: "0" },
    8:  { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    9:  { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    10: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    11: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    12: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    13: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    14: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "0" },
    15: { reactionAdj: "0", missileAdj: "0", defensiveAdj: "-1" },
    16: { reactionAdj: "+1", missileAdj: "+1", defensiveAdj: "-2" },
    17: { reactionAdj: "+2", missileAdj: "+2", defensiveAdj: "-3" },
    18: { reactionAdj: "+3", missileAdj: "+3", defensiveAdj: "-4" },
    19: { reactionAdj: "+3", missileAdj: "+3", defensiveAdj: "-4" },
    20: { reactionAdj: "+3", missileAdj: "+3", defensiveAdj: "-4" },
    21: { reactionAdj: "+4", missileAdj: "+4", defensiveAdj: "-5" },
    22: { reactionAdj: "+4", missileAdj: "+4", defensiveAdj: "-5" },
    23: { reactionAdj: "+4", missileAdj: "+4", defensiveAdj: "-5" },
    24: { reactionAdj: "+5", missileAdj: "+5", defensiveAdj: "-6" },
    25: { reactionAdj: "+5", missileAdj: "+5", defensiveAdj: "-6" }
  };

  const CONSTITUTION_TABLE = {
    3:  { hpAdj: "-2", systemShock: "35%", resurrection: "40%", surviveRaiseDead: "30%" },
    4:  { hpAdj: "-1", systemShock: "40%", resurrection: "45%", surviveRaiseDead: "35%" },
    5:  { hpAdj: "-1", systemShock: "45%", resurrection: "50%", surviveRaiseDead: "40%" },
    6:  { hpAdj: "-1", systemShock: "50%", resurrection: "55%", surviveRaiseDead: "45%" },
    7:  { hpAdj: "0", systemShock: "55%", resurrection: "60%", surviveRaiseDead: "50%" },
    8:  { hpAdj: "0", systemShock: "60%", resurrection: "65%", surviveRaiseDead: "55%" },
    9:  { hpAdj: "0", systemShock: "65%", resurrection: "70%", surviveRaiseDead: "60%" },
    10: { hpAdj: "0", systemShock: "70%", resurrection: "75%", surviveRaiseDead: "65%" },
    11: { hpAdj: "0", systemShock: "75%", resurrection: "80%", surviveRaiseDead: "70%" },
    12: { hpAdj: "0", systemShock: "80%", resurrection: "85%", surviveRaiseDead: "75%" },
    13: { hpAdj: "0", systemShock: "85%", resurrection: "90%", surviveRaiseDead: "80%" },
    14: { hpAdj: "0", systemShock: "88%", resurrection: "92%", surviveRaiseDead: "85%" },
    15: { hpAdj: "+1", systemShock: "91%", resurrection: "94%", surviveRaiseDead: "90%" },
    16: { hpAdj: "+2", systemShock: "95%", resurrection: "96%", surviveRaiseDead: "95%" },
    17: { hpAdj: "+2 (+3)*", systemShock: "97%", resurrection: "98%", surviveRaiseDead: "96%" },
    18: { hpAdj: "+2 (+4)*", systemShock: "99%", resurrection: "100%", surviveRaiseDead: "100%" },
    19: { hpAdj: "+5 (no 1s rolled)", systemShock: "99%", resurrection: "100%", regeneration: "None" },
    20: { hpAdj: "+5 (no 1s rolled)", systemShock: "99%", resurrection: "100%", regeneration: "1 point / 6 turns" },
    21: { hpAdj: "+6 (no 1s or 2s)", systemShock: "100%", resurrection: "100%", regeneration: "1 point / 5 turns" },
    22: { hpAdj: "+6 (no 1s or 2s)", systemShock: "100%", resurrection: "100%", regeneration: "1 point / 4 turns" },
    23: { hpAdj: "+6 (no 1s, 2s, 3s)", systemShock: "100%", resurrection: "100%", regeneration: "1 point / 3 turns" },
    24: { hpAdj: "+7 (no 1s, 2s, 3s)", systemShock: "100%", resurrection: "100%", regeneration: "1 point / 2 turns" },
    25: { hpAdj: "+7 (no 1s, 2s, 3s)", systemShock: "100%", resurrection: "100%", regeneration: "1 point / 1 turn" }
  };

  const CHARISMA_TABLE = {
    3:  { maxHenchmen: 1, loyaltyBase: "-30%", reactionAdj: "-25%" },
    4:  { maxHenchmen: 1, loyaltyBase: "-25%", reactionAdj: "-20%" },
    5:  { maxHenchmen: 2, loyaltyBase: "-20%", reactionAdj: "-15%" },
    6:  { maxHenchmen: 2, loyaltyBase: "-15%", reactionAdj: "-10%" },
    7:  { maxHenchmen: 3, loyaltyBase: "-10%", reactionAdj: "-05%" },
    8:  { maxHenchmen: 3, loyaltyBase: "-05%", reactionAdj: "0" },
    9:  { maxHenchmen: 4, loyaltyBase: "0", reactionAdj: "0" },
    10: { maxHenchmen: 4, loyaltyBase: "0", reactionAdj: "0" },
    11: { maxHenchmen: 4, loyaltyBase: "0", reactionAdj: "0" },
    12: { maxHenchmen: 5, loyaltyBase: "0", reactionAdj: "0" },
    13: { maxHenchmen: 5, loyaltyBase: "0", reactionAdj: "+05%" },
    14: { maxHenchmen: 6, loyaltyBase: "+05%", reactionAdj: "+10%" },
    15: { maxHenchmen: 7, loyaltyBase: "+15%", reactionAdj: "+15%" },
    16: { maxHenchmen: 8, loyaltyBase: "+20%", reactionAdj: "+25%" },
    17: { maxHenchmen: 10, loyaltyBase: "+30%", reactionAdj: "+30%" },
    18: { maxHenchmen: 15, loyaltyBase: "+40%", reactionAdj: "+35%" },
    19: { maxHenchmen: 20, loyaltyBase: "+50%", reactionAdj: "+40%" },
    20: { maxHenchmen: 25, loyaltyBase: "+60%", reactionAdj: "+45%" },
    21: { maxHenchmen: 30, loyaltyBase: "+70%", reactionAdj: "+50%" },
    22: { maxHenchmen: 35, loyaltyBase: "+80%", reactionAdj: "+55%" },
    23: { maxHenchmen: 40, loyaltyBase: "+90%", reactionAdj: "+60%" },
    24: { maxHenchmen: 45, loyaltyBase: "+100%", reactionAdj: "+65%" },
    25: { maxHenchmen: 50, loyaltyBase: "+100%", reactionAdj: "+70%" }
  };

  // This function would be added to apply racial modifiers
function applyRacialModifiers(actor) {
  if (!actor.system?.abilities) return actor;
  
  // Clone the actor to avoid modifying the original
  const modifiedActor = JSON.parse(JSON.stringify(actor));
  
  // Get race information
  const raceItem = actor.items?.find(i => i.type === "race");
  const raceName = raceItem?.name || actor.system?.details?.race?.name || "";
  
  // Apply racial modifiers based on race
  if (raceName) {
    const raceLower = raceName.toLowerCase();
    
    if (raceLower.includes("dwarf")) {
      // Dwarf: Constitution +1; Charisma -1
      modifiedActor.system.abilities.con.value += 1;
      modifiedActor.system.abilities.cha.value -= 1;
    } 
    else if (raceLower.includes("elf")) {
      // Elf: Dexterity +1; Constitution -1
      modifiedActor.system.abilities.dex.value += 1;
      modifiedActor.system.abilities.con.value -= 1;
    }
    else if (raceLower.includes("half-orc") || raceLower.includes("halforc")) {
      // Half-Orc: Strength +1; Constitution +1; Charisma -2
      modifiedActor.system.abilities.str.value += 1;
      modifiedActor.system.abilities.con.value += 1;
      modifiedActor.system.abilities.cha.value -= 2;
    }
    else if (raceLower.includes("halfling")) {
      // Halfling: Strength -1; Dexterity +1
      modifiedActor.system.abilities.str.value -= 1;
      modifiedActor.system.abilities.dex.value += 1;
    }
  }
  
  return modifiedActor;
}

  