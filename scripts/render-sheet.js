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
  
  function renderInventoryRow(subItem, itemMap = new Map()) {
    // Resolve full item if this is a shallow reference
    const fullItem =
      itemMap.get(subItem._id || subItem.uuid || subItem.id) || subItem;

    const li = document.createElement("li");
    li.className = "inventory-row";
    li.setAttribute("draggable", "true");
    li.dataset.uuid = fullItem.uuid || "";

    // Icon
    const icon = document.createElement("img");
    icon.className = "inventory-icon";
    icon.src = fullItem.img || "greyhawk-calendar/icons/item-bag.svg";
    icon.alt = "";
    icon.onerror = () => (icon.src = "greyhawk-calendar/icons/item-bag.svg");
    li.appendChild(icon);

    // Name
    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = fullItem.name ?? "(Unnamed)";
    if (fullItem.system?.attributes?.magic) name.classList.add("magic");
    li.appendChild(name);

    // Status icons
    const statusIcons = document.createElement("span");
    statusIcons.className = "status-icons";

    const loc = fullItem.system?.location?.state;
    const locIcon = document.createElement("span");
    locIcon.textContent = loc === "equipped" ? "🛡️" : loc === "carried" ? "🎒" : "📦";
    statusIcons.appendChild(locIcon);

    if (fullItem.system?.attributes?.magic) {
      const mag = document.createElement("span");
      mag.textContent = "✦";
      statusIcons.appendChild(mag);
    }

    const id = fullItem.system?.attributes?.identified;
    const idIcon = document.createElement("span");
    idIcon.textContent = id === false ? "👁️" : "✅";
    statusIcons.appendChild(idIcon);

    li.appendChild(statusIcons);

    // Quantity
    console.log(`Item ${fullItem.name} raw quantity:`, fullItem.system?.quantity);

    // Quantity - Extract and convert with validation
    let qtyVal;
    if (fullItem.system && 'quantity' in fullItem.system) {
      qtyVal = Number(fullItem.system.quantity);
    } else if (fullItem.quantity) {
      qtyVal = Number(fullItem.quantity);
    } else {
      qtyVal = 1;
    }

    // Ensure it's a valid number
    qtyVal = !isNaN(qtyVal) && qtyVal > 0 ? qtyVal : 1;
    console.log(`Item ${fullItem.name} final quantity:`, qtyVal);

    // Create the quantity element
    const qty = document.createElement("span");
    qty.textContent = qtyVal;
    qty.className = "center-text";
    qty.style.display = "inline-block"; // Ensure visibility
    qty.style.minWidth = "30px"; // Ensure minimum width
    li.appendChild(qty);

    // Total weight = quantity * unit weight
    const wtPer = Number(fullItem.system?.weight ?? 0);
    const totalWeight = (!isNaN(qtyVal) && !isNaN(wtPer)) ? qtyVal * wtPer : 0;
    //const totalWeight = qtyVal * wtPer;
    const weight = document.createElement("span");
    weight.textContent = totalWeight > 0 ? totalWeight.toFixed(2) : "-";
    weight.className = "center-text";
    li.appendChild(weight);

    return li;
  }


  function renderContainer(containerItem, nested = false, itemMap = new Map()) {
    const wrapper = document.createElement("div");
    wrapper.className = nested ? "nested-container" : "container";

    const toggle = document.createElement("details");
    toggle.open = true;

    const summary = document.createElement("summary");
    summary.textContent = containerItem.name;
    toggle.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "inventory-list";

    const items = containerItem.system?.itemList || [];

    // Header row
    const header = document.createElement("li");
    header.className = "inventory-row inventory-header";
    ["", "Name", "Status", "#", "Wt"].forEach(text => {
      const span = document.createElement("span");
      span.textContent = text;
      header.appendChild(span);
    });
    list.appendChild(header);

    for (let itemRef of items) {
      // Resolve actual item using id, uuid, or _id
      const resolvedItem =
        itemMap.get(itemRef._id || itemRef.uuid || itemRef.id) || itemRef;

      // Render the item row using full data
      const row = renderInventoryRow(resolvedItem, itemMap);
      list.appendChild(row);

      // Handle nested containers
      if (resolvedItem.type === "container") {
        // Create a wrapper for the nested container
        const nestedWrapper = document.createElement("li");
        nestedWrapper.className = "nested-container-wrapper";
        nestedWrapper.style.listStyle = "none";
        nestedWrapper.style.padding = 0;
        nestedWrapper.style.margin = 0;
        
        // Render the nested container with increased indentation
        const nested = renderContainer(resolvedItem, true, itemMap);
        
        // Apply visual styling for nested containers
        nested.style.marginLeft = nested ? "30px" : "20px"; // More indentation for deeply nested items
        nested.style.borderLeft = "2px dashed #aaa"; // Add a visual connector line
        nested.style.paddingLeft = "10px";
        nested.style.marginTop = "5px";
        nested.style.marginBottom = "5px";
        
        // Apply different background for nested containers to visually distinguish them
        const lists = nested.querySelectorAll(".inventory-list");
        lists.forEach(list => {
          list.style.background = "#e8e8d0"; // Slightly different background
        });
        
        // Add a prefix to indicate nesting in the header
        const summary = nested.querySelector("summary");
        if (summary) {
          summary.innerHTML = `📦 ${summary.textContent}`;
          summary.style.fontStyle = "italic";
        }
        
        nestedWrapper.appendChild(nested);
        list.appendChild(nestedWrapper);
      }
    }

    makeListDraggable(list);
    toggle.appendChild(list);
    wrapper.appendChild(toggle);
    return wrapper;
  }


  function renderLooseItemsTable(items) {
    const list = document.createElement("ul");
    list.className = "inventory-list";

    const header = document.createElement("li");
    header.className = "inventory-row inventory-header";
    ["", "Name", "Status", "#", "Wt"].forEach(text => {
      const span = document.createElement("span");
      span.textContent = text;
      header.appendChild(span);
    });
    list.appendChild(header);

    for (let item of items) {
      const row = renderInventoryRow(item);
      list.appendChild(row);
    }

    return list;
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
    
    // Character portrait container
    const portrait = document.createElement("div");
    portrait.style.width = "64px";
    portrait.style.height = "64px";
    portrait.style.marginRight = "10px";
    portrait.style.border = "1px solid #666";
    portrait.style.borderRadius = "5px";
    portrait.style.overflow = "hidden";
    portrait.style.flexShrink = "0";

    // Portrait image
    const portraitImg = document.createElement("img");

    // Determine the image source
    let imgSrc = actor.img || "icons/svg/mystery-man.svg";

    // Handle URL-encoded paths and extract filename
    if (imgSrc) {
      // First decode any URL-encoded characters like %20
      imgSrc = decodeURIComponent(imgSrc);
      
      // Check if it contains our target paths
      if (imgSrc.includes('pc counters') || imgSrc.includes('characters') || imgSrc.startsWith('C:')) {
        // Extract just the filename from the path
        const filename = imgSrc.split(/[/\\]/).pop();
        
        // Rewrite to use our images/characters directory with correct base path
        imgSrc = `/greyhawk-calendar/images/characters/${filename}`;
        console.warn(`Rewriting actor portrait from ${actor.img} to ${imgSrc}`);
      }
    }

    // Now assign the corrected imgSrc
    portraitImg.src = imgSrc;

    // Style and fallback
    portraitImg.style.width = "100%";
    portraitImg.style.height = "100%";
    portraitImg.style.objectFit = "cover";

    portraitImg.onerror = function() {
      this.onerror = null;
      this.src = "/icons/svg/mystery-man.svg";
      console.error(`❌ Failed to load portrait: ${imgSrc}`);
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
    acSection.style.flexDirection = "column";
    acSection.style.alignItems = "center";
    acSection.style.minWidth = "150px";
    acSection.style.backgroundColor = "#d0d0c0";
    acSection.style.padding = "10px";
    acSection.style.borderRadius = "5px";

    const acLabel = document.createElement("div");
    acLabel.textContent = "Armor Class";
    acLabel.style.fontSize = "12px";
    acLabel.style.fontWeight = "bold";
    acLabel.style.marginBottom = "5px";

    const acValue = document.createElement("div");
    acValue.style.fontSize = "36px";
    acValue.style.fontWeight = "bold";
    acValue.style.backgroundColor = "#e0e0d0";
    acValue.style.borderRadius = "8px";
    acValue.style.width = "60px";
    acValue.style.height = "60px";
    acValue.style.display = "flex";
    acValue.style.alignItems = "center";
    acValue.style.justifyContent = "center";
    acValue.style.marginBottom = "10px";

    const acValues = calculateArmorClass(actor);
    acValue.textContent = acValues.normal;

    // Define armor and shield before using them
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

    // Find protection items
    const protectionItems = actor.items?.filter(i => {
      const name = i.name?.toLowerCase() || "";
      return (name.includes("ring of protection") ||
              name.includes("cloak of protection") ||
              name.includes("amulet of protection")) &&
            i.system?.location?.state === "equipped";
    }) || [];

    // Now create the tooltip
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

    acValue.title = tooltip.trim();

    // ... rest of the code continues ...

    // Shieldless and rear AC rows
    const acDetails = document.createElement("div");
    acDetails.style.display = "flex";
    acDetails.style.flexDirection = "column";
    acDetails.style.width = "100%";
    acDetails.style.gap = "5px";

    const shieldlessRow = document.createElement("div");
    shieldlessRow.style.display = "flex";
    shieldlessRow.style.justifyContent = "space-between";
    const shieldlessLabel = document.createElement("span");
    shieldlessLabel.textContent = "Shieldless";
    shieldlessLabel.style.fontSize = "12px";
    shieldlessLabel.style.fontWeight = "bold";
    const shieldlessValue = document.createElement("span");
    shieldlessValue.textContent = acValues.shieldless;
    shieldlessValue.style.fontSize = "14px";
    shieldlessValue.style.fontWeight = "bold";
    shieldlessRow.appendChild(shieldlessLabel);
    shieldlessRow.appendChild(shieldlessValue);

    const rearRow = document.createElement("div");
    rearRow.style.display = "flex";
    rearRow.style.justifyContent = "space-between";
    const rearLabel = document.createElement("span");
    rearLabel.textContent = "Rear";
    rearLabel.style.fontSize = "12px";
    rearLabel.style.fontWeight = "bold";
    const rearValue = document.createElement("span");
    rearValue.textContent = acValues.rear;
    rearValue.style.fontSize = "14px";
    rearValue.style.fontWeight = "bold";
    rearRow.appendChild(rearLabel);
    rearRow.appendChild(rearValue);

    acDetails.appendChild(shieldlessRow);
    acDetails.appendChild(rearRow);

    acSection.appendChild(acLabel);
    acSection.appendChild(acValue);
    acSection.appendChild(acDetails);

    // Hit Points section
    const hpSection = document.createElement("div");
    hpSection.style.flex = "1";
    hpSection.style.display = "flex";
    hpSection.style.flexDirection = "column";
    hpSection.style.margin = "0 20px";

    const hpLabel = document.createElement("div");
    hpLabel.textContent = "Current Hit Points";
    hpLabel.style.fontSize = "12px";
    hpLabel.style.fontWeight = "bold";
    hpLabel.style.textAlign = "center";
    hpLabel.style.marginBottom = "5px";

    const hpValue = document.createElement("div");
    hpValue.textContent = actor.system?.attributes?.hp?.value || "0";
    hpValue.style.fontSize = "48px";
    hpValue.style.fontWeight = "bold";
    hpValue.style.textAlign = "center";

    const progressContainer = document.createElement("div");
    progressContainer.style.width = "100%";
    progressContainer.style.height = "10px";
    progressContainer.style.background = "#ccc";
    progressContainer.style.borderRadius = "5px";
    progressContainer.style.overflow = "hidden";
    progressContainer.style.margin = "10px 0";

    const progressBar = document.createElement("div");
    const hpValue2 = actor.system?.attributes?.hp?.value || 0;
    const hpMax = actor.system?.attributes?.hp?.max || 0;
    const hpPercent = hpMax > 0 ? (hpValue2 / hpMax) * 100 : 0;
    progressBar.style.width = `${hpPercent}%`;
    progressBar.style.height = "100%";
    progressBar.style.background = "linear-gradient(to right, #83c783, #56ab56)";
    progressContainer.appendChild(progressBar);

    const hpStats = document.createElement("div");
    hpStats.style.display = "flex";
    hpStats.style.justifyContent = "space-between";
    hpStats.style.fontSize = "14px";

    const maxDiv = document.createElement("div");
    maxDiv.innerHTML = `Max <span style="font-weight: bold">${actor.system?.attributes?.hp?.max || "0"}</span>`;

    const currentDiv = document.createElement("div");
    currentDiv.innerHTML = `Current <span style="font-weight: bold">${actor.system?.attributes?.hp?.value || "0"}</span>`;

    hpStats.appendChild(maxDiv);
    hpStats.appendChild(currentDiv);

    hpSection.appendChild(hpLabel);
    hpSection.appendChild(hpValue);
    hpSection.appendChild(progressContainer);
    hpSection.appendChild(hpStats);

    // Get current movement
    const currentMove = actor.system?.attributes?.movement?.value || "90";

    // Find base movement from item
    const baseMoveItem = actor.items?.find(item => item.name?.startsWith("Base Movement"));
    let baseMove = "???";
    if (baseMoveItem) {
      const match = baseMoveItem.name.match(/\d+/);
      if (match) baseMove = match[0];
    }

    // Movement section
    const moveSection = document.createElement("div");
    moveSection.style.display = "flex";
    moveSection.style.flexDirection = "column";
    moveSection.style.alignItems = "center";
    moveSection.style.minWidth = "150px";
    moveSection.style.marginRight = "20px";

    const moveLabel = document.createElement("div");
    moveLabel.textContent = "Move";
    moveLabel.style.fontSize = "12px";
    moveLabel.style.fontWeight = "bold";
    moveLabel.style.marginBottom = "5px";

    const moveValue = document.createElement("div");
    moveValue.textContent = currentMove;
    moveValue.style.fontSize = "48px";
    moveValue.style.fontWeight = "bold";

    const baseLabel = document.createElement("div");
    baseLabel.innerHTML = `Base <span style="font-weight: bold">${baseMove}</span>`;
    baseLabel.style.fontSize = "14px";
    baseLabel.style.marginTop = "10px";

    const moveProgressContainer = document.createElement("div");
    moveProgressContainer.style.width = "100px";
    moveProgressContainer.style.height = "10px";
    moveProgressContainer.style.background = "#ccc";
    moveProgressContainer.style.borderRadius = "5px";
    moveProgressContainer.style.overflow = "hidden";
    moveProgressContainer.style.margin = "5px 0";

    const moveProgressBar = document.createElement("div");
    moveProgressBar.style.width = "100%";
    moveProgressBar.style.height = "100%";
    moveProgressBar.style.background = "linear-gradient(to right, #83c783, #56ab56)";
    moveProgressContainer.appendChild(moveProgressBar);

    moveSection.appendChild(moveLabel);
    moveSection.appendChild(moveValue);
    moveSection.appendChild(baseLabel);
    moveSection.appendChild(moveProgressContainer);

    // Attack Matrix section
    const matrixSection = document.createElement("div");
    matrixSection.style.display = "flex";
    matrixSection.style.alignItems = "center";
    matrixSection.style.marginLeft = "auto";

    const matrixIcon = document.createElement("div");
    matrixIcon.textContent = "Attack\nMatrix";
    matrixIcon.style.width = "60px";
    matrixIcon.style.height = "60px";
    matrixIcon.style.backgroundColor = "#d0d0c0";
    matrixIcon.style.borderRadius = "8px";
    matrixIcon.style.display = "flex";
    matrixIcon.style.alignItems = "center";
    matrixIcon.style.justifyContent = "center";
    matrixIcon.style.textAlign = "center";
    matrixIcon.style.fontSize = "12px";
    matrixIcon.style.fontWeight = "bold";
    matrixIcon.style.color = "#666";
    matrixIcon.style.lineHeight = "1.2";

    matrixSection.appendChild(matrixIcon);

    // Add all sections to combat stats
    combatStats.appendChild(acSection);
    combatStats.appendChild(hpSection);
    combatStats.appendChild(moveSection);
    combatStats.appendChild(matrixSection);

    // Add combat header and stats to combat section
    combatSection.appendChild(combatHeader);
    combatSection.appendChild(combatStats);

    // Add combat section to header section
    headerSection.appendChild(combatSection);

    // Finally add header section to wrapper
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
    
    // Character Info Grid
    const basicInfo = document.createElement("div");
    basicInfo.style.display = "grid";
    basicInfo.style.gridTemplateColumns = "80px 1fr 120px 1fr";
    basicInfo.style.gap = "8px 15px";
    basicInfo.style.marginTop = "10px";
    basicInfo.style.backgroundColor = "#f0f0e8";
    basicInfo.style.padding = "10px";
    basicInfo.style.borderRadius = "5px";
    basicInfo.style.border = "1px solid #ccc";
  
    // Helper function to create a field row
    const createFieldRow = (label, value) => {
      const labelDiv = document.createElement("div");
      labelDiv.textContent = label;
      labelDiv.style.fontWeight = "bold";
      labelDiv.style.textAlign = "right";
      
      const valueDiv = document.createElement("div");
      valueDiv.textContent = value;
      
      if (label === "Background" && value === "Click to add...") {
        valueDiv.style.color = "#888";
        valueDiv.style.fontStyle = "italic";
      }
      
      return [labelDiv, valueDiv];
    };
  
    // Class
    let classDisplay = "Unknown";
    console.log("🔍 Debugging class display for:", actor.name);

    // 1. Find all class items
    if (actor.items) {
      const classItems = actor.items.filter(i => i.type === "class");

      if (classItems.length > 0) {
        const classes = classItems.map(classItem => {
          const className = classItem.name || "Unknown";
          let currentLevel = "?";

          if (Array.isArray(classItem.system?.advancement) && classItem.system.advancement.length > 0) {
            const levels = classItem.system.advancement.map(a => a.level || 0);
            currentLevel = Math.max(...levels);
          } else {
            console.log(`⚠ No advancement data found inside class item: ${className}`);
          }

          console.log(`✅ Class found: ${className} ${currentLevel}`);
          return `${className} ${currentLevel}`;
        });

        classDisplay = classes.join(" / ");
      } else {
        console.log("❌ No class items found in actor.items.");
      }
    } else {
      console.log("❌ No actor.items found.");
    }

    // 2. Create the field
    console.log("🎯 Final class display value:", classDisplay);
    const [classLabel, classValue] = createFieldRow("Class", classDisplay);
  
    // Race
    const raceItem = actor.items?.find(i => i.type === "race");
    const raceDisplay = raceItem?.name || actor.system?.details?.race?.name || "Unknown";
    const [raceLabel, raceValue] = createFieldRow("Race", raceDisplay);
  
    // Alignment
    const alignmentValue = formatAlignment(actor.system?.alignment || actor.system?.details?.alignment || "Unknown");
    const [alignmentLabel, alignmentValueDiv] = createFieldRow("Alignment", alignmentValue);
  
    // Background
    const backgroundValue = actor.system?.backgroundname || "Click to add...";
    const [backgroundLabel, backgroundValueDiv] = createFieldRow("Background", backgroundValue);
  
    // Size
    const sizeValue = actor.system?.details?.size || actor.system?.attributes?.size || "Medium";
    const [sizeLabel, sizeValueDiv] = createFieldRow("Size", sizeValue);
  
    // Add all fields to grid
    basicInfo.appendChild(classLabel);
    basicInfo.appendChild(classValue);
    basicInfo.appendChild(raceLabel);
    basicInfo.appendChild(raceValue);
    basicInfo.appendChild(alignmentLabel);
    basicInfo.appendChild(alignmentValueDiv);
    basicInfo.appendChild(backgroundLabel);
    basicInfo.appendChild(backgroundValueDiv);
    basicInfo.appendChild(sizeLabel);
    basicInfo.appendChild(sizeValueDiv);
  
    tab.appendChild(basicInfo);
  
    // Abilities Header
    const abilitiesHeader = document.createElement("div");
    abilitiesHeader.textContent = "Abilities";
    abilitiesHeader.style.textAlign = "center";
    abilitiesHeader.style.fontSize = "16px";
    abilitiesHeader.style.fontWeight = "bold";
    abilitiesHeader.style.margin = "20px 0 10px 0";
    tab.appendChild(abilitiesHeader);
  
    // Create divider line
    const divider = document.createElement("hr");
    divider.style.border = "0";
    divider.style.borderTop = "1px solid #888";
    divider.style.margin = "10px 0";
    tab.appendChild(divider);
  
    // Abilities section - compact layout
    const abilitiesSection = document.createElement("div");
    abilitiesSection.style.display = "flex";
    abilitiesSection.style.flexDirection = "column";
    abilitiesSection.style.gap = "3px";
  
    // STR table with compact styling
    const strTable = createSTRTable(actor);
    abilitiesSection.appendChild(strTable);
  
    // Other ability tables with compact styling
    const dexTable = createAbilityTable(actor, "DEX", 
      ["%", "Reaction Adj", "Missile Adj", "Def. Adj"],
      ["0", getReactionAdj(actor), getMissileAdj(actor), getDefAdj(actor)]
    );
    abilitiesSection.appendChild(dexTable);
  
    const conTable = createAbilityTable(actor, "CON", 
      ["%", "Hit Points", "System Shock", "Res. Survival", "Poison Adj", "Regeneration"],
      ["0", getHPBonus(actor), getSystemShock(actor), 
      getResurrection(actor), getPoisonAdj(actor), getRegeneration(actor)]
    );
    abilitiesSection.appendChild(conTable);
  
    const intTable = createAbilityTable(actor, "INT", 
      ["%", "# Languages", "Spell Level", "Learn Chance", "Max Spells", "Immunity"],
      ["0", getLanguages(actor), getSpellLevel(actor), 
      getLearnChance(actor), getMaxSpells(actor), getSpellImmunity(actor)]
    );
    abilitiesSection.appendChild(intTable);
  
    const wisTable = createAbilityTable(actor, "WIS", 
      ["%", "Magic Adj", "Spell Bonuses", "Spell Failure", "Immunity"],
      ["0", getMagicAdj(actor), getSpellBonuses(actor), 
      getSpellFailure(actor), getWisImmunity(actor)]
    );
    abilitiesSection.appendChild(wisTable);
  
    const chaTable = createAbilityTable(actor, "CHA", 
      ["%", "Max Henchmen", "Loyalty Base", "Reaction Adj"],
      ["0", getMaxHenchmen(actor), getLoyaltyBase(actor), 
      getChaReactionAdj(actor)]
    );
    abilitiesSection.appendChild(chaTable);
  
    tab.appendChild(abilitiesSection);
  
    // Saves section
    const savesDivider = document.createElement("hr");
    savesDivider.style.border = "0";
    savesDivider.style.borderTop = "1px solid #888";
    savesDivider.style.margin = "15px 0";
    tab.appendChild(savesDivider);
  
    const savesHeader = document.createElement("div");
    savesHeader.textContent = "Saves";
    savesHeader.style.textAlign = "right";
    savesHeader.style.fontSize = "16px";
    savesHeader.style.fontWeight = "bold";
    savesHeader.style.marginBottom = "10px";
    tab.appendChild(savesHeader);
  
    // Saves grid with compact layout to match sheet
    const savesGrid = document.createElement("div");
    savesGrid.style.display = "grid";
    savesGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
    savesGrid.style.gap = "8px";
    savesGrid.style.width = "100%";
    savesGrid.style.marginTop = "10px";
  
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
  
    saveTypes.forEach((save, index) => {
      const saveBox = document.createElement("div");
      saveBox.style.textAlign = "center";
      saveBox.style.border = "1px solid #999";
      saveBox.style.borderRadius = "4px";
      saveBox.style.padding = "4px";
      saveBox.style.backgroundColor = "#f0f0e8";
  
      const saveName = document.createElement("div");
      saveName.textContent = save.label;
      saveName.style.fontWeight = "bold";
      saveName.style.fontSize = "12px";
      saveName.style.marginBottom = "3px";
  
      const saveValue = document.createElement("div");
      saveValue.textContent = save.value;
      saveValue.style.fontSize = "18px";
      saveValue.style.border = "1px solid #ccc";
      saveValue.style.borderRadius = "50%";
      saveValue.style.width = "28px";
      saveValue.style.height = "28px";
      saveValue.style.display = "flex";
      saveValue.style.alignItems = "center";
      saveValue.style.justifyContent = "center";
      saveValue.style.margin = "0 auto";
      saveValue.style.backgroundColor = "#fff";
  
      saveBox.appendChild(saveName);
      saveBox.appendChild(saveValue);
      savesGrid.appendChild(saveBox);
    });
  
    tab.appendChild(savesGrid);
  
    // Items checkbox
    const itemsBox = document.createElement("div");
    itemsBox.style.display = "flex";
    itemsBox.style.alignItems = "center";
    itemsBox.style.justifyContent = "center";
    itemsBox.style.marginTop = "15px";
    itemsBox.style.backgroundColor = "#e8e8d8";
    itemsBox.style.border = "1px solid #ccc";
    itemsBox.style.borderRadius = "3px";
    itemsBox.style.padding = "5px 10px";
    itemsBox.style.width = "fit-content";
    itemsBox.style.margin = "15px auto 0";
  
    const itemsCheck = document.createElement("div");
    itemsCheck.innerHTML = "✓ Items";
    itemsCheck.style.fontWeight = "bold";
    itemsCheck.style.fontSize = "14px";
  
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
  
  // Then add the createItemsTab function
  function createItemsTab(actor) {
    const tab = document.createElement("div");
    tab.className = "tab-content";
    tab.dataset.tab = "items";
    tab.style.display = "none";

    const inventoryItems = (actor.items || []).filter(i =>
      ["weapon", "armor", "equipment", "consumable", "container"].includes(i.type)
    );

    // Create item lookup map for resolving container references
    const itemMap = new Map();
    (actor.items || []).forEach(item => {
      itemMap.set(item._id, item);
      if (item.uuid) itemMap.set(item.uuid, item);
      if (item.id) itemMap.set(item.id, item);

    });

    // 1. Loose top-level items (equipped or carried)
    const topLevelLooseItems = inventoryItems.filter(i =>
      i.type !== "container" &&
      (!i.system?.containerId || i.system?.containerId === "") &&
      (i.system?.location?.state === "equipped" || i.system?.location?.state === "carried")
    );

    // 2. Top-level containers
    const topLevelContainers = inventoryItems.filter(i =>
      i.type === "container" &&
      (!i.system?.containerId || i.system?.containerId === "")
    );

    // 3. Render loose items as table
    if (topLevelLooseItems.length > 0) {
      const looseLabel = document.createElement("h4");
      looseLabel.textContent = "Loose Items";
      tab.appendChild(looseLabel);

      const looseTable = renderLooseItemsTable(topLevelLooseItems, itemMap);
      tab.appendChild(looseTable);
    }

    // 4. Render top-level containers (each with nested contents)
    for (const container of topLevelContainers) {
      const containerBlock = renderContainer(container, false, itemMap);
      tab.appendChild(containerBlock);
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
  
  // Extract action groups from items -> system -> actionGroups
  let actionGroups = [];
  
  // Search through all items to find any that have actionGroups
  if (actor.items) {
    actor.items.forEach(item => {
      if (item.system?.actionGroups) {
        actionGroups = actionGroups.concat(item.system.actionGroups);
      }
    });
  }
  
  // Also check if there are actionGroups directly on the actor
  if (actor.actionGroups) {
    actionGroups = actionGroups.concat(actor.actionGroups);
  }
  
  // Add equipped weapons as action groups
  if (actor.items) {
    const equippedWeapons = actor.items.filter(item => 
      item.type === "weapon" && 
      item.system?.location?.state === "equipped"
    );
    
    equippedWeapons.forEach(weapon => {
      const weaponActionGroup = {
        id: weapon._id,
        name: weapon.name,
        img: weapon.img,
        actions: [{
          name: `Attack with ${weapon.name}`,
          img: weapon.img,
          type: weapon.system?.attack?.type || "weapon",
          misc: `${weapon.system?.attack?.type || "melee"} attack`,
          properties: []
        }]
      };
      
      actionGroups.push(weaponActionGroup);
    });
  }
  
  // Render each action group
  actionGroups.forEach(group => {
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
    content.style.padding = "10px";
    
    // Render the actions within this group
    if (group.actions && group.actions.length > 0) {
      group.actions.forEach(action => {
        const actionDiv = document.createElement("div");
        actionDiv.style.display = "flex";
        actionDiv.style.alignItems = "center";
        actionDiv.style.padding = "5px";
        actionDiv.style.borderBottom = "1px solid #eee";
        
        const actionIcon = document.createElement("img");
        actionIcon.src = action.img || "icons/svg/mystery-man.svg";
        actionIcon.alt = "";
        actionIcon.style.width = "16px";
        actionIcon.style.height = "16px";
        actionIcon.style.marginRight = "8px";
        
        const actionName = document.createElement("span");
        actionName.textContent = action.name;
        actionName.style.flex = "1";
        
        const actionType = document.createElement("span");
        actionType.textContent = action.type || "action";
        actionType.style.color = "#666";
        actionType.style.fontSize = "0.9em";
        actionType.style.marginLeft = "8px";
        
        actionDiv.appendChild(actionIcon);
        actionDiv.appendChild(actionName);
        actionDiv.appendChild(actionType);
        
        content.appendChild(actionDiv);
      });
    }
    
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
  
  // If no action groups, show a message
  if (actionGroups.length === 0) {
    const noActions = document.createElement("div");
    noActions.textContent = "No actions available";
    noActions.style.padding = "10px";
    noActions.style.color = "#666";
    noActions.style.textAlign = "center";
    actionList.appendChild(noActions);
  }
  
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

  