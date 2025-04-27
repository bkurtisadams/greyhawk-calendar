// Greyhawk Calendar - Constants and Data Structures
const CAMPAIGN_DATE = { year: 569, month: 1, day: 1 }; // clearly defined at top
const CAMPAIGN_EVENTS = [];
const CHARACTERS = [];
// Greyhawk months - chronological order
const GREYHAWK_MONTHS = [
    { id: 0, name: "Needfest", days: 7, isFestival: true },
    { id: 1, name: "Fireseek", days: 28 },
    { id: 2, name: "Readying", days: 28 },
    { id: 3, name: "Coldeven", days: 28 },
    { id: 4, name: "Growfest", days: 7, isFestival: true },
    { id: 5, name: "Planting", days: 28 },
    { id: 6, name: "Flocktime", days: 28 },
    { id: 7, name: "Wealsun", days: 28 },
    { id: 8, name: "Richfest", days: 7, isFestival: true },
    { id: 9, name: "Reaping", days: 28 },
    { id: 10, name: "Goodmonth", days: 28 },
    { id: 11, name: "Harvester", days: 28 },
    { id: 12, name: "Brewfest", days: 7, isFestival: true },
    { id: 13, name: "Patchwall", days: 28 },
    { id: 14, name: "Ready'reat", days: 28 },
    { id: 15, name: "Sunsebb", days: 28 }
];
const GREYHAWK_DAYS = [
    "Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"
];
// Days of the week
const WEEKDAYS = ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"];
// Greyhawk holidays - will be loaded from JSON but here's a starter set
const GREYHAWK_HOLIDAYS = [
    { name: "Midwinter's Night", month: 0, day: 4, type: "holiday", description: "The longest night of the year, many believe the veil between worlds is thin on this night." },
    { name: "Feast of Allitur", month: 1, day: 7, type: "holiday", description: "Sacred to the god of ethics and propriety. A day for solemn oaths and promises." },
    { name: "Melorian Memorial", month: 2, day: 17, type: "holiday", description: "Day of remembrance for those who died in the Battle of Emridy Meadows against the Temple of Elemental Evil." },
    { name: "Day of the Sun", month: 7, day: 14, type: "holiday", description: "Celebration of Pelor at the height of summer when the sun is most powerful." },
    { name: "Midsummer Night", month: 8, day: 4, type: "holiday", description: "Night of mystical power when magic is said to be stronger. Many witches and wizards perform rituals." },
    { name: "Feast of Edoira", month: 10, day: 4, type: "holiday", description: "A day of peace and fellowship dedicated to Rao, god of peace and reason." },
    { name: "Eternal Harvest", month: 12, day: 5, type: "holiday", description: "Festival dedicated to Beory the Oerth Mother and Obad-Hai, celebrating the bounty of the land." },
    { name: "Night of Long Shadows", month: 15, day: 11, type: "holiday", description: "Solemn night when the undead are said to walk more freely. Many stay indoors with protective candles lit." }
];

// Current date tracking - initialize to campaign start
let currentYear = 567; // Common Year (CY)
let currentMonth = 1; // Needfest
let currentDay = 1; // 1st day of the month

// UI state tracking
let activeView = localStorage.getItem("activeViewId") || "calendar-view";
let activeYear = currentYear;

// Tab switching helper
function switchTab(tabName) {
    // Hide all main tabs
    document.querySelectorAll(".main-tab").forEach(tab => tab.style.display = "none");
  
    // Find the tab element
    const tab = document.getElementById(tabName);
  
    if (tab) {
      tab.style.display = "block";
      localStorage.setItem("activeViewId", tabName);
    } else {
      console.warn(`Tab "${tabName}" not found. Falling back to Calendar.`);
      // fallback to Calendar view
      const fallbackTab = document.getElementById("calendar-view");
        if (fallbackTab) {
            fallbackTab.style.display = "block";
        }

      localStorage.setItem("activeViewId", "calendar-view");
    }
  }


/**
 * Calculate day of week for a Greyhawk date.
 * Returns 0-6 (0 = Starday, 6 = Freeday)
 */
function calculateDayOfWeek(year, month, day) {
    const referenceYear = 560;
    const daysPerYear = 364;
    let totalDays = (year - referenceYear) * daysPerYear;

    for (let m = 0; m < month; m++) {
        totalDays += GREYHAWK_MONTHS[m].isFestival ? 7 : 28;
    }
    totalDays += (day - 1);
    return totalDays % 7;
}

function updateCurrentDate() {
    const dateObj = {
        year: CAMPAIGN_DATE.year,
        month: CAMPAIGN_DATE.month,
        day: CAMPAIGN_DATE.day
    };

    const monthName = GREYHAWK_MONTHS[dateObj.month].name;
    const dayOfWeek = calculateDayOfWeek(dateObj.year, dateObj.month, dateObj.day);
    const weekdayName = GREYHAWK_DAYS[dayOfWeek];

    let dateString = `Current Campaign Date: ${weekdayName}, ${monthName} ${dateObj.day}, ${dateObj.year} CY`;

    const holidays = GREYHAWK_HOLIDAYS.filter(h => h.month === dateObj.month && h.day === dateObj.day);
    if (holidays.length > 0) {
        dateString += ` - ${holidays.map(h => h.name).join(", ")}`;
    }

    const events = getEventsForDate(dateObj.year, dateObj.month, dateObj.day);
    if (events.length > 0) {
        dateString += ` | Active Events: ${events.length}`;
    }

    document.getElementById('current-date').innerHTML = dateString;
}

async function loadCampaignData() {
    try {
        // Load events
        const eventsResponse = await fetch('data/campaign-events.json');
        if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            // Replace sample events with loaded data
            CAMPAIGN_EVENTS.length = 0; // Clear existing array
            events.forEach(event => CAMPAIGN_EVENTS.push(event));
        }

        console.log('Campaign data loaded successfully');

    } catch (error) {
        console.error('Error loading campaign data:', error);
        // Fall back to sample data which is already defined
    }
}

// Function to initialize the calendar application
function initializeCalendar() {
    loadContentFromLocalStorage();

    loadCampaignData().then(() => {
        // Update the display with the current campaign date
        updateCurrentDateDisplay();

        // Generate the calendar for the active year
        buildCalendarYear(activeYear);
        updateYearButtons();    // grey out button if necessary

        // Populate the timeline view
        generateTimeline();

        // Populate the holidays list
        generateHolidaysList();

        // Set up event listeners
        setupEventListeners();

        // Populate admin month/day selectors
        populateAdminDateSelectors();

        // Setup and restore view tab state
        setupTabButtons();
        restoreLastActiveView();  // <-- restore saved tab

        // load characters
        loadCharactersFromServer();

    });
}

// Function to update the current campaign date display
// Corrected updateCurrentDateDisplay function clearly
function updateCurrentDateDisplay() {
    const dateElement = document.getElementById('current-date');
    const month = GREYHAWK_MONTHS.find(m => m.id === currentMonth);

    // Calculate the day of the week
    let totalDays = 0;
    for (let m = 0; m < currentMonth; m++) {
        totalDays += GREYHAWK_MONTHS[m].days;
    }
    totalDays += currentDay - 1; // -1 because currentDay starts at 1, not 0
    const weekdayIndex = totalDays % 7;
    dateElement.textContent = `... ${GREYHAWK_DAYS[weekdayIndex]} ...`;

}

function generateSkillsHTML(items) {
    const skills = items.filter(item => item.type === 'skill' || item.type === 'proficiency');

    if (skills.length === 0) return '<div>No skills or proficiencies listed.</div>';

    let html = '<div class="skills">';

    skills.forEach(skill => {
        html += `
        <div class="skill-item">
            ${skill.img ? `<img src="${skill.img}" alt="${skill.name}" class="skill-img">` : ''}
            <strong>${skill.name}</strong>
            ${skill.system.proficiency ? ` - (${skill.system.proficiency.charAt(0).toUpperCase() + skill.system.proficiency.slice(1)})` : ''}
            ${skill.system.ability ? `<span class="skill-ability"> [${skill.system.ability.toUpperCase()}]</span>` : ''}
            ${skill.system.description?.value ? `<div class="skill-description">${skill.system.description.value}</div>` : ''}
        </div>
        `;
    });

    html += '</div>';

    return html;
}

function generateInventoryHTML(items) {
    const categories = {
        weapon: [],
        armor: [],
        equipment: [],
        consumable: [],
        treasure: [],
        container: [],
        other: []
    };

    items.forEach(item => {
        const category = categories[item.type] ? item.type : 'other';
        categories[category].push(item);
    });

    let html = '<div class="inventory">';

    for (const [category, itemsList] of Object.entries(categories)) {
        if (itemsList.length === 0) continue;

        html += `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4><ul>`;

        itemsList.forEach(item => {
            html += `
            <li>
                ${item.img ? `<img src="${item.img}" alt="${item.name}" class="item-img">` : ''}
                <strong>${item.name}</strong> 
                ${item.system.quantity ? `(x${item.system.quantity})` : ''}
                ${item.system.weight ? `- Weight: ${item.system.weight}` : ''}
                ${item.system.equipped ? '<span class="equipped"> [Equipped]</span>' : ''}
                ${item.system.description?.value ? `<div class="item-description">${item.system.description.value}</div>` : ''}
            </li>`;
        });

        html += '</ul>';
    }

    html += '</div>';

    return html;
}



// Function to generate the holidays list
function generateHolidaysList() {
    const container = document.getElementById('holiday-container');
    if (!container) {
        console.warn("⚠️ No holiday-container found — skipping holiday generation for now.");
        return;
    }

    container.innerHTML = ''; // Safe: Clear existing content

    // Sort holidays by month and day
    const sortedHolidays = [...GREYHAWK_HOLIDAYS].sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
    });

    // Group holidays by season
    const seasons = [
        { name: "Winter", months: [0, 1, 2, 3] },
        { name: "Spring", months: [4, 5, 6, 7] },
        { name: "Summer", months: [8, 9, 10, 11] },
        { name: "Autumn", months: [12, 13, 14, 15] }
    ];

    seasons.forEach(season => {
        const seasonHolidays = sortedHolidays.filter(h => season.months.includes(h.month));

        if (seasonHolidays.length > 0) {
            const seasonContainer = document.createElement('div');
            seasonContainer.className = 'holiday-season';
            seasonContainer.innerHTML = `<h3>${season.name} Holidays</h3>`;

            const holidaysList = document.createElement('div');
            holidaysList.className = 'holiday-items';

            seasonHolidays.forEach(holiday => {
                const holidayItem = document.createElement('div');
                holidayItem.className = 'holiday-item';

                const month = GREYHAWK_MONTHS.find(m => m.id === holiday.month);

                holidayItem.innerHTML = `
                    <h4>${holiday.name}</h4>
                    <p class="holiday-date">${month.name} ${holiday.day}</p>
                    <p>${holiday.description}</p>
                `;

                holidaysList.appendChild(holidayItem);
            });

            seasonContainer.appendChild(holidaysList);
            container.appendChild(seasonContainer);
        }
    });
}

function gregorianToGreyhawk(date) {
    // Get day of year (0-365)
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay) - 1; // 0-based day of year

    // Calculate Greyhawk date components
    let dayCount = dayOfYear;
    let monthIndex = 0;

    // Determine month and day
    while (dayCount >= 0) {
        const daysInMonth = (GREYHAWK_MONTHS[monthIndex].isFestival) ? 7 : 28;
        if (dayCount < daysInMonth) {
            break;
        }
        dayCount -= daysInMonth;
        monthIndex++;

        // Handle year overflow
        if (monthIndex >= GREYHAWK_MONTHS.length) {
            return {
                error: "Date out of range",
                gregorianDate: date
            };
        }
    }

    // Calculate day of week (0-6)
    const dayOfWeek = Math.floor(dayOfYear % 7);

    return {
        year: date.getFullYear(), // Keep the same year number
        month: monthIndex,
        monthName: GREYHAWK_MONTHS[monthIndex].name,
        day: dayCount + 1, // Convert to 1-based day
        dayOfWeek: dayOfWeek,
        weekdayName: GREYHAWK_DAYS[dayOfWeek],
        dayOfYear: dayOfYear,
        isFestival: GREYHAWK_MONTHS[monthIndex].isFestival,
        gregorianDate: date
    };
}

// Function to set up all event listeners
function setupEventListeners() {
    // View toggle buttons
    document.querySelectorAll('.toggle-view button').forEach(button => {
        button.addEventListener('click', () => {
            // Get view ID from button ID
            const viewId = button.id.replace('btn-', '') + '-view';

            // Hide current view and show selected view
            document.getElementById(activeView).classList.remove('active');
            document.getElementById(viewId).classList.add('active');

            // Update active button styling
            document.querySelector('.toggle-view button.active').classList.remove('active');
            button.classList.add('active');

            // Update active view tracking
            activeView = viewId;
        });
    });

    // Year navigation buttons
    document.getElementById('prev-year').addEventListener('click', () => {
        if (activeYear > 567) {
            activeYear--;
            buildCalendarYear(activeYear);
            updateYearButtons();
        }
    });
    
    document.getElementById('next-year').addEventListener('click', () => {
        if (activeYear < 570) {
            activeYear++;
            buildCalendarYear(activeYear);
            updateYearButtons();
        }
    });
    
    // Event filter checkboxes
    document.querySelectorAll('.event-filter input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateEventFilters);
    });

    // Modal close button
    document.querySelector('.modal .close').addEventListener('click', () => {
        document.getElementById('event-modal').style.display = 'none';
    });

    // Modal tab navigation
    document.querySelectorAll('.event-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Hide current tab content
            document.querySelector('.tab-content.active').classList.remove('active');

            // Show selected tab content
            const tabId = 'tab-' + tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');

            // Update active tab styling
            document.querySelector('.event-tab.active').classList.remove('active');
            tab.classList.add('active');
        });
    });

    // Admin panel toggle
    document.getElementById('admin-toggle').addEventListener('click', () => {
        const adminPanel = document.getElementById('admin-panel');

        if (adminPanel.classList.contains('active')) {
            adminPanel.classList.remove('active');
            document.getElementById('admin-toggle').textContent = '+';
        } else {
            adminPanel.classList.add('active');
            document.getElementById('admin-toggle').textContent = 'X';
        }
    });

    // Admin panel buttons
    document.getElementById('admin-save').addEventListener('click', saveAdminContent);
    document.getElementById('admin-cancel').addEventListener('click', clearAdminForm);
    document.getElementById('admin-delete').addEventListener('click', deleteSelectedContent);

    // Close modal when clicking outside of it
    window.addEventListener('click', event => {
        const modal = document.getElementById('event-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function updateYearButtons() {
    const prevBtn = document.getElementById('prev-year');
    const nextBtn = document.getElementById('next-year');

    prevBtn.disabled = (activeYear <= 567);
    nextBtn.disabled = (activeYear >= 570);
}

function generateTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; // Clear existing content

    // Sort events chronologically
    const sortedEvents = CAMPAIGN_EVENTS.slice().sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day));

    // Group events by year
    const eventsByYear = {};
    sortedEvents.forEach(event => {
        if (!eventsByYear[event.year]) eventsByYear[event.year] = [];
        eventsByYear[event.year].push(event);
    });

    // Create timeline entries by year
    Object.keys(eventsByYear).sort().forEach(year => {
        const yearContainer = document.createElement('div');
        yearContainer.className = 'timeline-year';
        yearContainer.innerHTML = `<h3>${year} CY</h3>`;

        const eventsList = document.createElement('div');
        eventsList.className = 'timeline-events';

        // Add events for this year
        eventsByYear[year].forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = `timeline-event ${event.type}`;

            const month = GREYHAWK_MONTHS[event.date.month] || { name: 'Unknown Month' };

            eventItem.innerHTML = `
                <div class="timeline-date">${event.day} ${month.name}</div>
                <div class="timeline-content">
                    <h4>${event.title}</h4>
                    <p>${event.description}</p>
                </div>
            `;

            eventsList.appendChild(eventItem);
        });

        yearContainer.className = 'timeline-year';
        yearContainer.appendChild(eventsList);

        container.appendChild(yearContainer);
    });
}

function greyhawkToGregorian(year, month, day) {
    // Validate inputs
    if (month < 0 || month >= GREYHAWK_MONTHS.length) {
        throw new Error("Invalid Greyhawk month");
    }

    const maxDays = GREYHAWK_MONTHS[month].isFestival ? 7 : 28;
    if (day < 1 || day > maxDays) {
        throw new Error("Invalid day for specified Greyhawk month");
    }

    // Calculate day of year
    let dayOfYear = 0;
    for (let m = 0; m < month; m++) {
        dayOfYear += GREYHAWK_MONTHS[m].isFestival ? 7 : 28;
    }
    dayOfYear += (day - 1); // Convert from 1-based to 0-based

    // Create Gregorian date
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + dayOfYear);
    return date;
}

function getHolidaysForDate(greyhawkDate) {
    return GREYHAWK_HOLIDAYS.filter(holiday => {
        return (
            holiday.month === greyhawkDate.month &&
            holiday.day === greyhawkDate.day
        );
    });
}

function getEventsForDate(year, month, day) {
    return CAMPAIGN_EVENTS.filter(event => {
        return (
            event.date.year === year &&
            event.date.month === month &&
            event.date.day === day
        );
    });
}

function buildCalendarYear(year) {
    const container = document.getElementById('calendar-container');
    container.innerHTML = ''; // Clear previous content

    // Update displayed year
    document.getElementById('display-year').textContent = year + ' CY';    // Check if year is inside campaign range

    if (year < 567 || year > 570) {
        const message = document.createElement('div');
        message.style.textAlign = "center";
        message.style.padding = "2em";
        message.style.fontSize = "1.2em";
        message.style.color = "#8b4513";
        message.innerHTML = `No Campaign Events for ${year} CY.`;
        container.appendChild(message);
        return; // ❌ Stop building the calendar
    }

    // Create a month card for each Greyhawk month
    GREYHAWK_MONTHS.forEach((month, monthIndex) => {
        const monthCard = document.createElement('div');
        monthCard.className = `month-card ${month.isFestival ? 'festival' : ''}`;

        const monthTitle = document.createElement('h3');
        monthTitle.textContent = month.name;
        monthCard.appendChild(monthTitle);

        // Add weekday headers
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';

        GREYHAWK_DAYS.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day.substring(0, 3); // Abbreviate
            calendarGrid.appendChild(dayHeader);
        });

        // Calculate first day of week for this month
        const firstDayOfWeek = calculateDayOfWeek(year, monthIndex, 1);

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }

        // Add actual days
        const daysInMonth = month.isFestival ? 7 : 28;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';

            // Check if this is the current campaign date
            if (year === CAMPAIGN_DATE.year &&
                monthIndex === CAMPAIGN_DATE.month &&
                day === CAMPAIGN_DATE.day) {
                dayCell.classList.add('current-day');
            }

            // Add the day number
            dayCell.textContent = day;

            // Check for holidays
            const holidays = GREYHAWK_HOLIDAYS.filter(h =>
                h.month === monthIndex && h.day === day);

            if (holidays.length > 0 && document.getElementById('filter-holiday').checked) {
                dayCell.classList.add('holiday');
                dayCell.title = holidays.map(h => h.name).join(', ');
            }

            // Check for campaign events
            const events = getEventsForDate(year, monthIndex, day);

            if (events.length > 0) {
                // Add markers for each event type
                const eventsByType = {
                    'adventure': 0,
                    'battle': 0,
                    'npc-event': 0
                };

                events.forEach(event => {
                    eventsByType[event.type]++;
                });

                // Add event markers
                if (eventsByType.adventure > 0 && document.getElementById('filter-adventure').checked) {
                    dayCell.classList.add('adventure');
                    const marker = document.createElement('div');
                    marker.className = 'day-marker adventure-marker';
                    dayCell.appendChild(marker);
                }

                if (eventsByType.battle > 0 && document.getElementById('filter-battle').checked) {
                    dayCell.classList.add('battle');
                    const marker = document.createElement('div');
                    marker.className = 'day-marker battle-marker';
                    dayCell.appendChild(marker);
                }

                if (eventsByType['npc-event'] > 0 && document.getElementById('filter-npc').checked) {
                    dayCell.classList.add('npc-event');
                    const marker = document.createElement('div');
                    marker.className = 'day-marker npc-marker';
                    dayCell.appendChild(marker);
                }

                // Add click handler to open event details
                dayCell.addEventListener('click', function () {
                    showEventDetails(events[0]); // Show first event for simplicity
                });
            }

            calendarGrid.appendChild(dayCell);
        }

        monthCard.appendChild(calendarGrid);
        container.appendChild(monthCard);
    });
}

function buildTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; // Clear previous content

    // Create the outer timeline wrapper
    const timelineWrapper = document.createElement('div');
    timelineWrapper.className = 'timeline';

    // Sort events by date
    const sortedEvents = [...CAMPAIGN_EVENTS].sort((a, b) => {
        if (a.date.year !== b.date.year) {
            return a.date.year - b.date.year;
        }
        if (a.date.month !== b.date.month) {
            return a.date.month - b.date.month;
        }
        return a.date.day - b.date.day;
    });

    // Create timeline items
    sortedEvents.forEach((event, index) => {
        if (!event.date || typeof event.date.month !== 'number' || !GREYHAWK_MONTHS[event.date.month]) {
            console.warn('Skipping event with invalid date:', event);
            return; // Skip invalid events
        }

        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-container ${index % 2 === 0 ? 'timeline-left' : 'timeline-right'}`;

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const title = document.createElement('h3');
        title.textContent = event.title;

        const dateStr = document.createElement('div');
        dateStr.className = 'event-date';
        dateStr.textContent = `${GREYHAWK_MONTHS[event.date.month].name} ${event.date.day}, ${event.date.year} CY`;

        const summary = document.createElement('p');
        summary.textContent = event.summary;

        content.classList.add(event.type);
        content.appendChild(title);
        content.appendChild(dateStr);
        content.appendChild(summary);

        content.addEventListener('click', function () {
            showEventDetails(event);
        });

        timelineItem.appendChild(content);
        timelineWrapper.appendChild(timelineItem);
    });

    // Append the fully built timeline into the container
    container.appendChild(timelineWrapper);
}


function buildCharacterList() {
    const container = document.getElementById('character-container');
    container.innerHTML = ''; // Clear previous content

    // Create character cards
    CHARACTERS.filter(c => c && c.name && c.stats).forEach(character => {
        const charCard = document.createElement('div');
        charCard.className = 'character-card';

        const header = document.createElement('h3');
        header.textContent = character.name;

        const raceCls = document.createElement('p');
        raceCls.textContent = `${character.race} ${character.class} (Level ${character.level})`;

        const stats = document.createElement('div');
        stats.className = 'character-stats';

        // Add ability scores
        for (const [key, value] of Object.entries(character.stats)) {
            const stat = document.createElement('div');
            stat.className = 'character-stat';

            const statName = document.createElement('span');
            statName.textContent = key.toUpperCase();

            const statValue = document.createElement('span');
            statValue.textContent = value;

            stat.appendChild(statName);
            stat.appendChild(statValue);
            stats.appendChild(stat);
        }

        const bio = document.createElement('p');
        bio.className = 'character-bio';
        bio.textContent = character.bio || '';

        const player = document.createElement('p');
        player.textContent = `Player: ${character.player || 'Unknown'}`;

        charCard.appendChild(header);
        charCard.appendChild(raceCls);
        charCard.appendChild(stats);
        charCard.appendChild(bio);
        charCard.appendChild(player);

        container.appendChild(charCard);
    });
}

function buildHolidayList() {
    const container = document.getElementById('holiday-container');
    container.innerHTML = ''; // Clear previous content

    // Sort holidays by date
    const sortedHolidays = [...GREYHAWK_HOLIDAYS].sort((a, b) => {
        if (a.month !== b.month) {
            return a.month - b.month;
        }
        return a.day - b.day;
    });

    // Create list of holidays
    sortedHolidays.forEach(holiday => {
        const holidayItem = document.createElement('div');
        holidayItem.className = 'holiday-item';

        const holidayTitle = document.createElement('h3');
        holidayTitle.textContent = holiday.name;

        const holidayDate = document.createElement('p');
        holidayDate.className = 'holiday-date';
        holidayDate.textContent = `${GREYHAWK_MONTHS[holiday.month].name} ${holiday.day}`;

        const holidayDescription = document.createElement('p');
        holidayDescription.textContent = holiday.description;

        holidayItem.appendChild(holidayTitle);
        holidayItem.appendChild(holidayDate);
        holidayItem.appendChild(holidayDescription);
        container.appendChild(holidayItem);
    });
}

function populateAdminMonthSelect() {
    const select = document.getElementById('admin-month');
    select.innerHTML = ''; // Clear existing options

    GREYHAWK_MONTHS.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month.name;
        select.appendChild(option);
    });

    // Update days when month changes
    select.addEventListener('change', updateAdminDaySelect);

    // Initialize days
    updateAdminDaySelect();
}

function updateAdminDaySelect() {
    const monthSelect = document.getElementById('admin-month');
    const daySelect = document.getElementById('admin-day');
    const selectedMonth = parseInt(monthSelect.value);

    daySelect.innerHTML = ''; // Clear existing options

    const daysInMonth = GREYHAWK_MONTHS[selectedMonth].isFestival ? 7 : 28;
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

function restoreLastActiveView() {
    const lastViewId = localStorage.getItem("activeViewId");
    if (lastViewId && document.getElementById(lastViewId)) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.toggle-view button').forEach(b => b.classList.remove('active'));

        document.getElementById(lastViewId).classList.add('active');

        const btnId = `btn-${lastViewId.replace('-view', '')}`;
        document.getElementById(btnId)?.classList.add('active');
    }
}

function setupTabButtons() {
    const buttons = [
        { id: 'btn-calendar', view: 'calendar-view' },
        { id: 'btn-timeline', view: 'timeline-view' },
        { id: 'btn-characters', view: 'characters-view' },
        { id: 'btn-months', view: 'months-view' },
        { id: 'btn-holidays', view: 'holidays-view' }
    ];

    buttons.forEach(button => {
        const btn = document.getElementById(button.id);
        const view = document.getElementById(button.view);

        if (btn && view) {
            btn.addEventListener('click', function () {
                buttons.forEach(b => {
                    document.getElementById(b.view)?.classList.remove('active');
                    document.getElementById(b.id)?.classList.remove('active');
                });

                btn.classList.add('active');
                view.classList.add('active');

                // Store active view ID
                localStorage.setItem("activeViewId", button.view);
            });
        }
    });
}



function setupEventTabs() {
    const tabs = document.querySelectorAll('.event-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Update tab states
            document.querySelectorAll('.event-tab').forEach(t => {
                t.classList.remove('active');
            });

            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
            });

            // Activate selected tab
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });
}

function setupModal() {
    const modal = document.getElementById('event-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Function to update event filters
function updateEventFilters() {
    const filters = {
        holiday: document.getElementById('filter-holiday').checked,
        adventure: document.getElementById('filter-adventure').checked,
        battle: document.getElementById('filter-battle').checked,
        'npc-event': document.getElementById('filter-npc').checked
    };

    // Update visibility of event markers
    document.querySelectorAll('.event-marker').forEach(marker => {
        const eventType = marker.classList[1]; // Second class is the event type
        marker.style.display = filters[eventType] ? 'block' : 'none';
    });

    // Update visibility of festival events
    document.querySelectorAll('.festival-event').forEach(event => {
        const eventType = event.classList[1]; // Second class is the event type
        event.style.display = filters[eventType] ? 'block' : 'none';
    });

    // Update timeline events
    document.querySelectorAll('.timeline-event').forEach(event => {
        const eventType = event.classList[1]; // Second class is the event type
        event.style.display = filters[eventType] ? 'block' : 'none';
    });
}

/* function setupYearNavigation() {
    document.getElementById('prev-year').addEventListener('click', function () {
        const currentYear = parseInt(document.getElementById('display-year').textContent);
        buildCalendarYear(currentYear - 1);
    });

    document.getElementById('next-year').addEventListener('click', function () {
        const currentYear = parseInt(document.getElementById('display-year').textContent);
        buildCalendarYear(currentYear + 1);
    });
} */

function setupAdminPanel() {
    const adminToggle = document.getElementById('admin-toggle');
    const adminPanel = document.getElementById('admin-panel');

    adminToggle.addEventListener('click', function () {
        adminPanel.classList.toggle('visible');
        adminToggle.textContent = adminPanel.classList.contains('visible') ? '×' : '+';
    });

    document.getElementById('admin-type').addEventListener('change', function () {
        const type = this.value;
        const dateSection = document.getElementById('date-section');

        // Show date section for events, hide for characters
        dateSection.style.display = type === 'character' ? 'none' : 'block';
    });

    document.getElementById('admin-save').addEventListener('click', function () {
        saveContentToLocalStorage();
        adminPanel.classList.remove('visible');
        adminToggle.textContent = '+';

        // Refresh displayed data
        buildCalendarYear(parseInt(document.getElementById('display-year').textContent));
        buildTimeline();
        buildCharacterList();
    });

    document.getElementById('admin-cancel').addEventListener('click', function () {
        adminPanel.classList.remove('visible');
        adminToggle.textContent = '+';
    });
}

function saveContentToLocalStorage() {
    const type = document.getElementById('admin-type').value;
    const title = document.getElementById('admin-title').value;
    const summary = document.getElementById('admin-summary').value;
    const details = document.getElementById('admin-details').value;

    if (!title || !summary) {
        alert('Title and summary are required!');
        return;
    }

    if (type === 'character') {
        // Add new character
        const newChar = {
            id: 'char-' + (CHARACTERS.length + 1),
            name: title,
            race: 'Unknown',
            class: 'Unknown',
            level: 1,
            stats: {
                str: 10, dex: 10, con: 10,
                int: 10, wis: 10, cha: 10
            },
            bio: summary,
            player: 'Unknown'
        };

        CHARACTERS.push(newChar);
        localStorage.setItem('greyhawk-characters', JSON.stringify(CHARACTERS));
    } else {
        // Add new event
        const year = parseInt(document.getElementById('admin-year').value);
        const month = parseInt(document.getElementById('admin-month').value);
        const day = parseInt(document.getElementById('admin-day').value);

        const newEvent = {
            id: 'event-' + (CAMPAIGN_EVENTS.length + 1),
            title: title,
            type: type,
            date: { year, month, day },
            summary: summary,
            details: details,
            characters: []
        };

        CAMPAIGN_EVENTS.push(newEvent);
        localStorage.setItem('greyhawk-events', JSON.stringify(CAMPAIGN_EVENTS));
    }
}

function loadContentFromLocalStorage() {
    // Your existing logic here
    const savedEvents = localStorage.getItem('greyhawk-events');
    if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        parsedEvents.forEach(event => {
            if (!CAMPAIGN_EVENTS.some(e => e.id === event.id)) {
                CAMPAIGN_EVENTS.push(event);
            }
        });
    }


const savedCharacters = localStorage.getItem('greyhawk-characters');
    if (savedCharacters) {
        try {
            const parsedCharacters = JSON.parse(savedCharacters);
            parsedCharacters.forEach(character => {
                if (character?.name) {
                    // Generate an id if it doesn't exist
                    if (!character.id) {
                        character.id = 'char-' + character.name.toLowerCase().replace(/\s+/g, '-');
                    }
                    
                    if (!CHARACTERS.some(c => c.id === character.id)) {
                        CHARACTERS.push(character);
                    }
                } else {
                    console.warn("Skipped invalid character:", character);
                }
            });
        } catch (err) {
            console.error("Failed to parse stored characters:", err);
        }
}

const savedDate = localStorage.getItem('greyhawk-campaign-date');
    if (savedDate) {
        const parsedDate = JSON.parse(savedDate);
        CAMPAIGN_DATE.year = parsedDate.year;
        CAMPAIGN_DATE.month = parsedDate.month;
        CAMPAIGN_DATE.day = parsedDate.day;
    }

}

function generateCalendarGrid(year) {
    const container = document.getElementById('calendar-container');
    container.innerHTML = ''; // Clear existing content

    // Create each month
    GREYHAWK_MONTHS.forEach(month => {
        // Create month container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        monthContainer.innerHTML = `<h3 class="${month.isFestival ? 'festival-title' : ''}">${month.name}</h3>`;

        // Create days grid for non-festivals
        if (!month.isFestival) {
            // Add day headers (Starday through Freeday)
            const daysHeader = document.createElement('div');
            daysHeader.className = 'days-header';

            WEEKDAYS.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-name';
                dayHeader.textContent = day.substring(0, 2); // Abbreviate to 2 chars
                daysHeader.appendChild(dayHeader);
            });

            monthContainer.appendChild(daysHeader);

            // Create the days grid
            const daysGrid = document.createElement('div');
            daysGrid.className = 'days-grid';

            // Calculate the day of the week for the 1st of the month
            let yearStartDay = calculateYearStartDay(year);
            let monthStartDay = calculateMonthStartDay(month.id, yearStartDay);

            // Add blank cells for days before the 1st of the month
            for (let i = 0; i < monthStartDay; i++) {
                const blankDay = document.createElement('div');
                blankDay.className = 'day empty';
                daysGrid.appendChild(blankDay);
            }

            // Add the days of the month
            for (let day = 1; day <= month.days; day++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'day';
                dayCell.textContent = day;

                // Check for events on this day
                const events = findEvents(year, month.id, day);

                if (events.length > 0) {
                    // Create event markers
                    events.forEach(event => {
                        const marker = document.createElement('div');
                        marker.className = `event-marker ${event.type}`;
                        marker.title = event.title;
                        marker.dataset.event = JSON.stringify(event);
                        marker.addEventListener('click', () => showEventModal(event));
                        dayCell.appendChild(marker);
                    });

                    // Add an event class to the day
                    dayCell.classList.add('has-events');
                }

                // Check if this is the current campaign date
                if (year === currentYear && month.id === currentMonth && day === currentDay) {
                    dayCell.classList.add('current-day');
                }

                daysGrid.appendChild(dayCell);
            }

            monthContainer.appendChild(daysGrid);
        } else {
            // For festivals, display a special layout
            const festivalContainer = document.createElement('div');
            festivalContainer.className = 'festival-container';

            // Find events during this festival
            for (let day = 1; day <= month.days; day++) {
                const events = findEvents(year, month.id, day);

                const dayDiv = document.createElement('div');
                dayDiv.className = 'festival-day';

                const dayHeader = document.createElement('div');
                dayHeader.className = 'festival-day-header';

                // Calculate the weekday
                let yearStartDay = calculateYearStartDay(year);
                let monthStartDay = calculateMonthStartDay(month.id, yearStartDay);
                let weekdayIndex = (monthStartDay + day - 1) % 7;

                dayHeader.textContent = `${WEEKDAYS[weekdayIndex]}, Day ${day}`;
                dayDiv.appendChild(dayHeader);

                if (events.length > 0) {
                    // Create event entries
                    events.forEach(event => {
                        const eventDiv = document.createElement('div');
                        eventDiv.className = `festival-event ${event.type}`;
                        eventDiv.textContent = event.title;
                        eventDiv.addEventListener('click', () => showEventModal(event));
                        dayDiv.appendChild(eventDiv);
                    });

                    dayDiv.classList.add('has-events');
                }

                // Check if this is the current campaign date
                if (year === currentYear && month.id === currentMonth && day === currentDay) {
                    dayDiv.classList.add('current-day');
                }

                festivalContainer.appendChild(dayDiv);
            }

            monthContainer.appendChild(festivalContainer);
        }

        container.appendChild(monthContainer);
    });

    // Update the displayed year
    document.getElementById('display-year').textContent = `${year} CY`;
}

function findEvents(year, month, day) {
    // Combine campaign events and holidays
    const allEvents = [...CAMPAIGN_EVENTS];

    // Add relevant holiday events
    GREYHAWK_HOLIDAYS.forEach(holiday => {
        if (holiday.month === month && holiday.day === day) {
            allEvents.push({
                id: `holiday-${holiday.name.toLowerCase().replace(/\s/g, '-')}`,
                title: holiday.name,
                description: holiday.description,
                type: 'holiday',
                year: year, // Holidays repeat every year
                month: month,
                day: day
            });
        }
    });

    // Filter for events on this specific date
    return allEvents.filter(event =>
        event.date &&
        event.date.year === year &&
        event.date.month === month &&
        event.date.day === day
    );

}

function showEventModal(event) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('modal-title');
    const date = document.getElementById('modal-date');
    const summary = document.getElementById('modal-summary');
    const details = document.getElementById('modal-details');
    const characters = document.getElementById('modal-characters');
    const maps = document.getElementById('modal-maps');

    // Populate modal content
    title.textContent = event.title;

    // Format the date
    const month = GREYHAWK_MONTHS[event.date.month] || { name: 'Unknown Month' };

    date.textContent = `${event.day} ${month.name}, ${event.year} CY`;

    // Set summary and details
    summary.innerHTML = event.description || 'No summary available.';
    details.innerHTML = event.fullDetails || event.description || 'No details available.';

    // Populate characters involved
    characters.innerHTML = '';
    if (character && character.name) {
        const charCard = document.createElement('div');
        charCard.className = 'character-card';
    
        const header = document.createElement('h3');
        header.textContent = character.name;
    
        const raceCls = document.createElement('p');
        raceCls.textContent = `${character.race ?? 'Unknown'} ${character.class ?? 'Class'} (Level ${character.level ?? '?'})`;
    
        charCard.appendChild(header);
        charCard.appendChild(raceCls);
        charContent.appendChild(charCard);
    } else {
        const charItem = document.createElement('p');
        charItem.textContent = charName ?? 'Unnamed character';
        charContent.appendChild(charItem);
    }

    // Populate maps and images
    maps.innerHTML = '';
    if (event.images && event.images.length > 0) {
        event.images.forEach(image => {
            const img = document.createElement('img');
            img.src = `images/${image}`;
            img.alt = event.title;
            img.className = 'event-image';
            maps.appendChild(img);
        });
    } else {
        maps.textContent = 'No maps or images available.';
    }

    // Show the modal
    modal.style.display = 'block';

    // Default to the summary tab
    document.querySelector('.event-tab.active').classList.remove('active');
    document.getElementById('tab-summary').classList.remove('active');
    document.querySelector('.event-tab[data-tab="summary"]').classList.add('active');
    document.getElementById('tab-summary').classList.add('active');
}

// Function to populate the admin date selectors
function populateAdminDateSelectors() {
    const monthSelect = document.getElementById('admin-month');
    const daySelect = document.getElementById('admin-day');

    // Populate months
    monthSelect.innerHTML = '';
    GREYHAWK_MONTHS.forEach(month => {
        const option = document.createElement('option');
        option.value = month.id;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    });

    // Set up event listener to update days when month changes
    monthSelect.addEventListener('change', () => {
        updateAdminDayOptions(parseInt(monthSelect.value));
    });

    // Initial population of days
    updateAdminDayOptions(parseInt(monthSelect.value));
}

// Function to update the day options based on selected month
function updateAdminDayOptions(monthId) {
    const daySelect = document.getElementById('admin-day');
    const month = GREYHAWK_MONTHS.find(m => m.id === monthId);

    daySelect.innerHTML = '';

    for (let day = 1; day <= month.days; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

// Function to save content from the admin form
function saveAdminContent() {
    const type = document.getElementById('admin-type').value;
    const title = document.getElementById('admin-title').value;

    // Validate required fields
    if (!title) {
        alert('Please enter a title.');
        return;
    }

    if (type === 'character') {
        // Save character
        const character = {
            id: 'char-' + Date.now(), // Generate a unique ID
            name: title,
            type: 'npc', // Default to NPC
            shortDescription: document.getElementById('admin-summary').value,
            fullBio: document.getElementById('admin-details').value
        };

        CHARACTERS.push(character);
        
    } else {
        // Save event
        const year = parseInt(document.getElementById('admin-year').value);
        const month = parseInt(document.getElementById('admin-month').value);
        const day = parseInt(document.getElementById('admin-day').value);

        const event = {
            id: 'event-' + Date.now(), // Generate a unique ID
            title: title,
            type: type,
            year: year,
            month: month,
            day: day,
            description: document.getElementById('admin-summary').value,
            fullDetails: document.getElementById('admin-details').value
        };

        CAMPAIGN_EVENTS.push(event);

        // Refresh displays
        generateCalendarGrid(activeYear);
        generateTimeline();
    }

    // Clear the form
    clearAdminForm();

    // TODO: Add functionality to save to JSON files
    console.log('Content saved. Note: Persistent storage to JSON files not yet implemented.');
}

// Function to clear the admin form
function clearAdminForm() {
    document.getElementById('admin-title').value = '';
    document.getElementById('admin-summary').value = '';
    document.getElementById('admin-details').value = '';

    // Close the admin panel
    document.getElementById('admin-panel').classList.remove('active');
    document.getElementById('admin-toggle').textContent = '+';
}

// Function to delete selected content (placeholder for now)
function deleteSelectedContent() {
    alert('Delete functionality not yet implemented.');
    // TODO: Implement deletion of events and characters
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
});


// Function to generate the calendar grid for a given year


// Function to calculate the day of the week for the first day of the year
function calculateYearStartDay(year) {
    // For simplicity, we'll say year 1 CY started on Starday (0)
    // Each year advances by 1 day (standard years) or 2 days (leap years)
    // Note: Oerth does not have leap years in the Greyhawk calendar,
    // as each month has a fixed number of days

    // Each year has 364 days total, which is 52 weeks exactly
    // So the start day doesn't change from year to year
    return 0; // Starday
}

// Function to calculate the start day of a given month
function calculateMonthStartDay(monthId, yearStartDay) {
    let totalDays = 0;

    // Sum up the days in all months before this one
    for (let i = 0; i < monthId; i++) {
        totalDays += GREYHAWK_MONTHS[i].days;
    }

    // Return the day of week (0-6)
    return (yearStartDay + totalDays) % 7;
}

// Modal functions
function showEventDetails(event) {
    // Update modal content
    document.getElementById('modal-title').textContent = event.title;
    document.getElementById('modal-date').textContent =
        `${GREYHAWK_MONTHS[event.date.month].name} ${event.date.day}, ${event.date.year} CY`;

    document.getElementById('modal-summary').innerHTML = `<p>${event.summary}</p>`;
    document.getElementById('modal-details').innerHTML = `<p>${event.details}</p>`;

    // Update characters tab
    const charContent = document.getElementById('modal-characters');
    charContent.innerHTML = '';

    if (Array.isArray(event.characters) && event.characters.length > 0) {
        event.characters.forEach(charName => {
            const character = CHARACTERS.find(c => c.name === charName);
            if (character && character.name) {
                const charCard = document.createElement('div');
                charCard.className = 'character-card';
        
                const header = document.createElement('h3');
                header.textContent = character.name;
        
                const raceCls = document.createElement('p');
                raceCls.textContent = `${character.race ?? 'Unknown Race'} ${character.class ?? 'Class'} (Level ${character.level ?? '?'})`;
        
                charCard.appendChild(header);
                charCard.appendChild(raceCls);
                charContent.appendChild(charCard);
            } else {
                const charItem = document.createElement('p');
                charItem.textContent = typeof charName === 'string' ? charName : 'Unknown character';
                charContent.appendChild(charItem);
            }
        });
        
    } else {
        charContent.innerHTML = '<p>No character information available for this event.</p>';
    }

    // Update maps tab
    document.getElementById('modal-maps').innerHTML =
        '<p>No maps or images available for this event.</p>';

    // Show the modal
    document.getElementById('event-modal').style.display = 'block';
}

    document.addEventListener("DOMContentLoaded", () => {
        // Now safe to bind buttons to getStoredCharacters etc.
        document.getElementById('clear-characters-btn')?.addEventListener('click', () => {
        localStorage.removeItem('storedCharacters');
        location.reload();
        });
    
    document.getElementById('upload-character-file')?.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        const uploadedCharacter = await readCharacterFile(file);
        if (uploadedCharacter) {
          const currentCharacters = getStoredCharacters();
          currentCharacters.push(uploadedCharacter);
          saveStoredCharacters(currentCharacters);
          location.reload();
        }
      }
    });
  });

  // Toggle between views
function setupEventFilters() {
    const filters = [
        'filter-holiday',
        'filter-adventure',
        'filter-battle',
        'filter-npc'
    ];

    filters.forEach(filter => {
        document.getElementById(filter).addEventListener('change', function () {
            buildCalendarYear(parseInt(document.getElementById('display-year').textContent));
        });
    });
}

async function loadCharactersFromServer() {
    try {
        const response = await fetch('/greyhawk-calendar/data/characters/index.json');
        if (!response.ok) throw new Error('Failed to load character index.');

        const characterFiles = await response.json();

        const characterPromises = characterFiles.map(async (file) => {
            const charResponse = await fetch(`/greyhawk-calendar/data/characters/${file}`);
            if (!charResponse.ok) throw new Error(`Failed to load character: ${file}`);
            return await charResponse.json();
        });

        const characters = await Promise.all(characterPromises);

        // Now render each character
        characters.forEach(actor => {
            renderCharacterSheet(actor);
        });

        console.log(`✅ Loaded ${characters.length} characters from server.`);
    } catch (err) {
        console.error('❌ Error loading characters:', err);
    }
}

