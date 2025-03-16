// Greyhawk Calendar - Constants and Data Structures

// Campaign events array - will be loaded from JSON
const CAMPAIGN_EVENTS = [];

// Characters array - will be loaded from JSON
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

// Days of the week
const WEEKDAYS = ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"];

// Current date tracking - initialize to campaign start
let currentYear = 568; // Common Year (CY)
let currentMonth = 5; // Planting
let currentDay = 1; // 1st day of the month

// UI state tracking
let activeView = "calendar-view";
let activeYear = currentYear;

// Function to load campaign data from JSON files
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
        
        // Load characters
        const charactersResponse = await fetch('data/campaign-characters.json');
        if (charactersResponse.ok) {
            const characters = await charactersResponse.json();
            // Replace sample characters with loaded data
            CHARACTERS.length = 0; // Clear existing array
            characters.forEach(character => CHARACTERS.push(character));
        }
        
        // Optionally load custom holidays if you have them
        // const holidaysResponse = await fetch('data/campaign-holidays.json');
        // if (holidaysResponse.ok) {
        //     const holidays = await holidaysResponse.json();
        //     GREYHAWK_HOLIDAYS.length = 0;
        //     holidays.forEach(holiday => GREYHAWK_HOLIDAYS.push(holiday));
        // }
        
        console.log('Campaign data loaded successfully');
        
    } catch (error) {
        console.error('Error loading campaign data:', error);
        // Fall back to sample data which is already defined
    }
}

// Function to initialize the calendar application
function initializeCalendar() {
    loadCampaignData().then(() => {
        // Update the display with the current campaign date
        updateCurrentDateDisplay();
        
        // Generate the calendar for the active year
        generateCalendarGrid(activeYear);
        
        // Populate the timeline view
        generateTimeline();
        
        // Populate the character sheets
        generateCharacterSheets();
        
        // Populate the holidays list
        generateHolidaysList();
        
        // Set up event listeners
        setupEventListeners();
        
        // Populate admin month/day selectors
        populateAdminDateSelectors();
    });
}

// Function to update the current campaign date display
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
    
    dateElement.textContent = `Current Campaign Date: ${WEEKDAYS[weekdayIndex]}, ${currentDay} ${month.name}, ${currentYear} CY`;
            
            // Add event listener to show modal when clicked
            eventItem.addEventListener('click', () => showEventModal(event));
            
            eventsList.appendChild(eventItem);
        });
        
        yearContainer.appendChild(eventsList);
        container.appendChild(yearContainer);
    });
}

// Function to generate character sheets
function generateCharacterSheets() {
    const container = document.getElementById('character-container');
    container.innerHTML = ''; // Clear existing content
    
    // Create character cards
    CHARACTERS.forEach(character => {
        const charCard = document.createElement('div');
        charCard.className = `character-card ${character.type}`;
        
        charCard.innerHTML = `
            <div class="character-header">
                <h3>${character.name}</h3>
                <p class="character-type">${character.type === 'pc' ? 'Player Character' : 'NPC'}</p>
            </div>
            
            <div class="character-body">
                <div class="character-portrait">
                    ${character.portrait ? `<img src="images/${character.portrait}" alt="${character.name}">` : '<div class="placeholder-portrait"></div>'}
                </div>
                
                <div class="character-bio">
                    <p>${character.shortDescription}</p>
                </div>
                
                <div class="character-details">
                    ${character.race ? `<p><strong>Race:</strong> ${character.race}</p>` : ''}
                    ${character.class ? `<p><strong>Class:</strong> ${character.class}</p>` : ''}
                    ${character.affiliation ? `<p><strong>Affiliation:</strong> ${character.affiliation}</p>` : ''}
                </div>
            </div>
            
            ${character.fullBio ? `
            <div class="character-expand">
                <button class="expand-bio">Show Full Bio</button>
                <div class="full-bio hidden">
                    ${character.fullBio}
                </div>
            </div>
            ` : ''}
        `;
        
        container.appendChild(charCard);
        
        // Add event listener to expand bio if it exists
        if (character.fullBio) {
            const expandButton = charCard.querySelector('.expand-bio');
            const fullBio = charCard.querySelector('.full-bio');
            
            expandButton.addEventListener('click', () => {
                if (fullBio.classList.contains('hidden')) {
                    fullBio.classList.remove('hidden');
                    expandButton.textContent = 'Hide Full Bio';
                } else {
                    fullBio.classList.add('hidden');
                    expandButton.textContent = 'Show Full Bio';
                }
            });
        }
    });
}

// Function to generate the holidays list
function generateHolidaysList() {
    const container = document.getElementById('holiday-container');
    container.innerHTML = ''; // Clear existing content
    
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
        activeYear--;
        generateCalendarGrid(activeYear);
    });
    
    document.getElementById('next-year').addEventListener('click', () => {
        activeYear++;
        generateCalendarGrid(activeYear);
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
        generateCharacterSheets();
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
document.addEventListener('DOMContentLoaded', initializeCalendar);

}

// Function to generate the calendar grid for a given year
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

// Function to find events on a specific date
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
        event.year === year && 
        event.month === month && 
        event.day === day
    );
}

// Function to show the event modal with the selected event details
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
    const month = GREYHAWK_MONTHS.find(m => m.id === event.month);
    date.textContent = `${event.day} ${month.name}, ${event.year} CY`;
    
    // Set summary and details
    summary.innerHTML = event.description || 'No summary available.';
    details.innerHTML = event.fullDetails || event.description || 'No details available.';
    
    // Populate characters involved
    characters.innerHTML = '';
    if (event.characters && event.characters.length > 0) {
        const charList = document.createElement('ul');
        charList.className = 'character-list';
        
        event.characters.forEach(charId => {
            const character = CHARACTERS.find(c => c.id === charId);
            if (character) {
                const charItem = document.createElement('li');
                charItem.innerHTML = `<strong>${character.name}</strong>: ${character.shortDescription}`;
                charList.appendChild(charItem);
            }
        });
        
        characters.appendChild(charList);
    } else {
        characters.textContent = 'No character information available.';
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

// Function to generate the timeline view
function generateTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; // Clear existing content
    
    // Sort events chronologically
    const sortedEvents = [...CAMPAIGN_EVENTS].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
    });
    
    // Group events by year
    const eventsByYear = {};
    sortedEvents.forEach(event => {
        if (!eventsByYear[event.year]) {
            eventsByYear[event.year] = [];
        }
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
            
            const month = GREYHAWK_MONTHS.find(m => m.id === event.month);
            
            eventItem.innerHTML = `
                <div class="timeline-date">${event.day} ${month.name}</div>
                <div class="timeline-content">
                    <h4>${event.title}</h4>
                    <p>${event.description}</p>
                </div>
            `;