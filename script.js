let currentDate = new Date();
let events = JSON.parse(localStorage.getItem('events')) || {};
let selectedDate = null;
let currentFilter = 'all';
let templates = JSON.parse(localStorage.getItem('templates')) || [];
let currentEventId = null;

// Initialize calendar
function initCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    monthDisplay.textContent = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    renderCalendar();
}

// Render calendar days
function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        dayElement.dataset.date = dateString;
        
        // Add the day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Add events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';
        dayElement.appendChild(eventsContainer);

        // Add drag and drop handlers
        addDragDropToDay(dayElement, dateString);

        // Add click handler for new events
        dayElement.addEventListener('click', (e) => {
            if (e.target === dayElement || e.target === dayNumber || e.target === eventsContainer) {
                openNewEventModal(dateString);
            }
        });

        // Render existing events
        if (events[dateString]) {
            events[dateString].forEach(event => {
                if (currentFilter === 'all' || currentFilter === event.user) {
                    renderEvent(event, eventsContainer, dateString);
                }
            });
        }

        calendarDays.appendChild(dayElement);
    }
}

// Navigation functions
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    initCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    initCalendar();
}

// Utility functions
const USERS = {
    DECLAN: 'declan',
    AMY: 'amy',
    BOTH: 'both'
};

// Modal handling
class Modal {
    static closeAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.remove();
        });
    }

    static create(content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                ${content}
            </div>
        `;

        // Add close button functionality
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.remove();
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
        modal.style.display = 'block';
        return modal;
    }

    static confirm(title, message, onConfirm) {
        const content = `
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-actions">
                <button onclick="Modal.closeAll()" class="cancel-btn">Cancel</button>
                <button class="delete-btn">Confirm</button>
            </div>
        `;
        const modal = this.create(content);
        modal.querySelector('.delete-btn').onclick = () => {
            onConfirm();
            modal.remove();
        };
    }
}

// Modal handling
const modal = document.getElementById('eventModal');
const closeBtn = document.getElementsByClassName('close')[0];

function openModal(date) {
    selectedDate = date;
    modal.style.display = 'block';
}

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Event handling
document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get the form data
    const eventData = {
        id: generateUniqueId(),
        title: document.getElementById('eventTitle').value,
        startTime: `${document.getElementById('eventStartHour').value}:${document.getElementById('eventStartMinute').value}`,
        endTime: `${document.getElementById('eventEndHour').value}:${document.getElementById('eventEndMinute').value}`,
        description: document.getElementById('eventDescription').value,
        user: document.getElementById('eventUser').value,
        color: document.getElementById('eventColor').value
    };

    // Make sure we have the selected date
    if (!selectedDate) {
        console.error('No date selected');
        return;
    }

    // Initialize the events array for this date if it doesn't exist
    if (!events[selectedDate]) {
        events[selectedDate] = [];
    }

    // Add the new event
    events[selectedDate].push(eventData);

    // Save to localStorage
    localStorage.setItem('events', JSON.stringify(events));

    // Close the modal
    const modal = document.getElementById('eventModal');
    modal.style.display = 'none';

    // Clear the form
    e.target.reset();

    // Refresh the calendar display
    renderCalendar();
});

// Filter events
function filterEvents(user) {
    currentFilter = user;
    
    // Update active state of filter buttons
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter calendar events
    renderCalendar();
    
    // Filter templates
    const templatesContainer = document.getElementById('templates-container');
    templatesContainer.innerHTML = ''; // Clear current templates
    
    // Show only templates for the selected user (or all if 'all' is selected)
    templates.forEach((template, index) => {
        if (user === 'all' || template.user === user.toLowerCase()) {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            templateEl.draggable = true;
            templateEl.style.backgroundColor = template.color;
            templateEl.innerHTML = `
                <strong>${template.title}</strong>
                <p>${template.startTime} - ${template.endTime}</p>
            `;
            
            // Add drag functionality
            templateEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(template));
            });

            // Add edit functionality
            templateEl.addEventListener('dblclick', () => editTemplate(index));
            
            templatesContainer.appendChild(templateEl);
        }
    });
}

// Template functions
function saveTemplate(template) {
    templates.push(template);
    localStorage.setItem('templates', JSON.stringify(templates));
    renderTemplates();
}

function renderTemplates() {
    const container = document.getElementById('templates-container');
    container.innerHTML = '';
    
    templates.forEach((template, index) => {
        // Only show templates if they match the filter or if showing all
        if (currentFilter === 'all' || template.user === currentFilter) {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            templateEl.draggable = true;
            templateEl.style.backgroundColor = template.color;
            templateEl.innerHTML = `
                <strong>${template.title}</strong>
                <p>${template.startTime} - ${template.endTime}</p>
            `;
            
            // Add drag functionality
            templateEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(template));
            });

            // Add edit functionality
            templateEl.addEventListener('dblclick', () => editTemplate(index));
            
            container.appendChild(templateEl);
        }
    });
}

// Modified event rendering
function renderEvent(event, container, dateString) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${event.user}`;
    eventDiv.style.backgroundColor = event.color;
    
    // Just show the title
    eventDiv.innerHTML = `<span class="event-title">${event.title}</span>`;

    // Single click - show details popup
    eventDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showEventDetails(event, dateString, e);
    });

    // Double click - edit event
    eventDiv.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openEditEventModal(event, dateString);
    });

    container.appendChild(eventDiv);
}

// Add function to show event details popup
function showEventDetails(event, dateString, clickEvent) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.event-details-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'event-details-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <h3>${event.title}</h3>
            <span class="close-popup">&times;</span>
        </div>
        <div class="popup-content">
            <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
            <p><strong>Description:</strong> ${event.description}</p>
        </div>
        <div class="popup-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    // Position the popup
    document.body.appendChild(popup);
    positionPopup(popup, clickEvent);

    // Add event listeners for popup actions
    popup.querySelector('.close-popup').onclick = () => popup.remove();
    popup.querySelector('.edit-btn').onclick = () => {
        popup.remove();
        openEditEventModal(event, dateString);
    };
    popup.querySelector('.delete-btn').onclick = () => {
        popup.remove();
        confirmDelete(event.id, dateString);
    };

    // Close popup when clicking outside
    document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && !e.target.closest('.event')) {
            popup.remove();
            document.removeEventListener('click', closePopup);
        }
    });
}

// Helper function to position the popup
function positionPopup(popup, clickEvent) {
    const rect = clickEvent.target.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    
    let left = rect.left;
    let top = rect.bottom + 5;

    // Adjust if popup would go off screen
    if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (top + popupRect.height > window.innerHeight) {
        top = rect.top - popupRect.height - 5;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

// Add drag and drop handlers to calendar days
function addDragDropToDay(dayElement, dateString) {
    dayElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        dayElement.classList.add('drag-over');
    });

    dayElement.addEventListener('dragleave', () => {
        dayElement.classList.remove('drag-over');
    });

    dayElement.addEventListener('drop', (e) => {
        e.preventDefault();
        dayElement.classList.remove('drag-over');
        
        try {
            const templateData = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (templateData) {
                addEventFromTemplate(templateData, dateString);
            }
        } catch (error) {
            console.error('Error adding template:', error);
        }
    });
}

function addEventFromTemplate(template, dateString) {
    const newEvent = {
        id: generateUniqueId(), // Generate new ID for each instance
        title: template.title,
        startTime: template.startTime,
        endTime: template.endTime,
        description: template.description,
        user: template.user,
        color: template.color,
        templateId: template.id // Keep reference to original template
    };

    if (!events[dateString]) {
        events[dateString] = [];
    }

    events[dateString].push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    renderCalendar();
}

function editEvent(eventId) {
    currentEventId = eventId;
    const event = findEventById(eventId);
    
    if (event) {
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventStartTime').value = event.startTime;
        document.getElementById('eventEndTime').value = event.endTime;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventUser').value = event.user;
        document.getElementById('eventColor').value = event.color;
        document.getElementById('deleteEventBtn').style.display = 'block';
        
        openModal(event.date);
    }
}

function confirmDelete(eventId, dateString) {
    Modal.confirm(
        'Delete Event',
        'Are you sure you want to delete this event?',
        () => deleteEvent(eventId, dateString)
    );
}

function deleteEvent(eventId, dateString) {
    if (events[dateString]) {
        events[dateString] = events[dateString].filter(event => event.id !== eventId);
        if (events[dateString].length === 0) {
            delete events[dateString];
        }
        localStorage.setItem('events', JSON.stringify(events));
        renderCalendar();
    }
}

// Utility functions
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Function to initialize time dropdowns
function initializeTimeDropdowns() {
    const hourSelects = document.querySelectorAll('select[id*="Hour"]');
    const minuteSelects = document.querySelectorAll('select[id*="Minute"]');
    
    // Populate hours (00-23)
    hourSelects.forEach(select => {
        select.innerHTML = ''; // Clear existing options
        for(let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            const option = new Option(hour, hour);
            select.appendChild(option);
        }
    });
    
    // Populate minutes (00, 15, 30, 45)
    minuteSelects.forEach(select => {
        select.innerHTML = ''; // Clear existing options
        for(let i = 0; i < 60; i += 15) {
            const minute = i.toString().padStart(2, '0');
            const option = new Option(minute, minute);
            select.appendChild(option);
        }
    });
}

// Template modal functions
function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    initializeTimeDropdowns(); // Reinitialize dropdowns
    modal.style.display = 'block';
}

// Add template editing functions
function editTemplate(index) {
    const template = templates[index];
    openTemplateEditModal(template);
}

function openTemplateEditModal(template) {
    const templateModal = document.getElementById('templateModal');
    const form = document.getElementById('templateForm');
    
    // Fill form with template data
    document.getElementById('templateTitle').value = template.title;
    document.getElementById('templateStartHour').value = template.startTime.split(':')[0];
    document.getElementById('templateStartMinute').value = template.startTime.split(':')[1];
    document.getElementById('templateEndHour').value = template.endTime.split(':')[0];
    document.getElementById('templateEndMinute').value = template.endTime.split(':')[1];
    document.getElementById('templateDescription').value = template.description;
    document.getElementById('templateUser').value = template.user;
    document.getElementById('templateColor').value = template.color;

    // Add template ID to form for reference
    form.dataset.editingTemplateId = template.id;
    
    // Add delete button if not already present
    if (!document.getElementById('deleteTemplateBtn')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteTemplateBtn';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete Template';
        deleteBtn.onclick = () => confirmDeleteTemplate(template.id);
        form.appendChild(deleteBtn);
    }

    templateModal.style.display = 'block';
}

// Modify the template form submission handler
document.getElementById('templateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const templateData = {
        id: this.dataset.editingTemplateId || generateUniqueId(),
        title: document.getElementById('templateTitle').value,
        startTime: `${document.getElementById('templateStartHour').value}:${document.getElementById('templateStartMinute').value}`,
        endTime: `${document.getElementById('templateEndHour').value}:${document.getElementById('templateEndMinute').value}`,
        description: document.getElementById('templateDescription').value,
        user: document.getElementById('templateUser').value,
        color: document.getElementById('templateColor').value
    };

    if (this.dataset.editingTemplateId) {
        // Update existing template and related events
        updateTemplateAndEvents(templateData);
    } else {
        // Add new template
        saveTemplate(templateData);
    }

    // Reset form and close modal
    this.reset();
    this.dataset.editingTemplateId = '';
    document.getElementById('templateModal').style.display = 'none';
});

function updateTemplateAndEvents(updatedTemplate) {
    // Update template in templates array
    const templateIndex = templates.findIndex(t => t.id === updatedTemplate.id);
    if (templateIndex !== -1) {
        templates[templateIndex] = updatedTemplate;
        localStorage.setItem('templates', JSON.stringify(templates));
    }

    // Update all events that were created from this template
    for (let date in events) {
        events[date] = events[date].map(event => {
            if (event.templateId === updatedTemplate.id) {
                return {
                    ...event,
                    title: updatedTemplate.title,
                    startTime: updatedTemplate.startTime,
                    endTime: updatedTemplate.endTime,
                    description: updatedTemplate.description,
                    user: updatedTemplate.user,
                    color: updatedTemplate.color
                };
            }
            return event;
        });
    }

    localStorage.setItem('events', JSON.stringify(events));
    renderCalendar();
    renderTemplates();
}

// Add template deletion functions
function confirmDeleteTemplate(templateId) {
    Modal.confirm(
        'Delete Template',
        'Are you sure you want to delete this template? This will also remove all events created from this template.',
        () => deleteTemplate(templateId)
    );
}

function deleteTemplate(templateId) {
    // Remove template from templates array
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem('templates', JSON.stringify(templates));

    // Remove all events created from this template
    for (let date in events) {
        events[date] = events[date].filter(event => event.templateId !== templateId);
        if (events[date].length === 0) {
            delete events[date];
        }
    }

    localStorage.setItem('events', JSON.stringify(events));
    document.getElementById('templateModal').style.display = 'none';
    renderCalendar();
    renderTemplates();
}

// Separate modal opening functions
function openNewEventModal(dateString) {
    selectedDate = dateString;
    const modal = document.getElementById('eventModal');
    initializeTimeDropdowns(); // Reinitialize dropdowns
    document.getElementById('eventForm').reset();
    document.getElementById('modalTitle').textContent = 'Add Event';
    document.getElementById('deleteEventBtn').style.display = 'none';
    currentEventId = null;
    modal.style.display = 'block';
}

function openEditEventModal(event, dateString) {
    const modal = document.getElementById('eventModal');
    document.getElementById('modalTitle').textContent = 'Edit Event';
    
    // Fill in the form with event details
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventStartHour').value = event.startTime.split(':')[0];
    document.getElementById('eventStartMinute').value = event.startTime.split(':')[1];
    document.getElementById('eventEndHour').value = event.endTime.split(':')[0];
    document.getElementById('eventEndMinute').value = event.endTime.split(':')[1];
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventUser').value = event.user;
    document.getElementById('eventColor').value = event.color;
    
    document.getElementById('deleteEventBtn').style.display = 'block';
    currentEventId = event.id;
    selectedDate = dateString;
    modal.style.display = 'block';
}

// Add these new functions
function confirmClearMonth() {
    const currentMonthYear = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    Modal.confirm(
        'Clear Calendar',
        `Are you sure you want to delete all events for ${currentMonthYear}?<br><span class="warning-text">This action cannot be undone!</span>`,
        clearMonth
    );
}

function clearMonth() {
    // Get current month and year
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Filter out events from the current month
    for (let date in events) {
        const eventDate = new Date(date);
        if (eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month) {
            delete events[date];
        }
    }
    
    // Save to localStorage and refresh calendar
    localStorage.setItem('events', JSON.stringify(events));
    renderCalendar();
}

// Update modal initialization
function initializeModals() {
    // Hide all modals by default
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Update modal opening function
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Add these functions to handle recurrence
function initializeRecurrenceHandlers() {
    // Toggle recurrence options
    document.getElementById('isRecurring').addEventListener('change', function(e) {
        const options = e.target.closest('.recurrence-section').querySelector('.recurrence-options');
        options.style.display = e.target.checked ? 'block' : 'none';
    });

    // Toggle pattern types
    document.getElementById('recurrencePattern').addEventListener('change', function(e) {
        const simplePattern = document.getElementById('simplePattern');
        const customPattern = document.getElementById('customPattern');
        
        if (e.target.value === 'simple') {
            simplePattern.style.display = 'block';
            customPattern.style.display = 'none';
        } else {
            simplePattern.style.display = 'none';
            customPattern.style.display = 'block';
        }
    });

    // Handle end type changes
    document.getElementById('endType').addEventListener('change', function(e) {
        const occurrences = document.getElementById('occurrences');
        const endDate = document.getElementById('endDate');
        
        occurrences.style.display = 'none';
        endDate.style.display = 'none';
        
        if (e.target.value === 'after') {
            occurrences.style.display = 'block';
        } else if (e.target.value === 'on') {
            endDate.style.display = 'block';
        }
    });
}

// Function to get recurrence data
function getRecurrenceData() {
    const isRecurring = document.getElementById('isRecurring').checked;
    
    if (!isRecurring) return null;

    const pattern = document.getElementById('recurrencePattern').value;
    const recurrenceData = {
        type: pattern,
        endType: document.getElementById('endType').value
    };

    if (pattern === 'simple') {
        recurrenceData.frequency = {
            value: document.getElementById('repeatFrequency').value,
            unit: document.getElementById('repeatUnit').value
        };
        recurrenceData.weekdays = Array.from(document.querySelectorAll('.weekdays input:checked'))
            .map(cb => parseInt(cb.value));
    } else {
        recurrenceData.customPattern = {
            daysOn: parseInt(document.getElementById('daysOn').value),
            daysOff: parseInt(document.getElementById('daysOff').value)
        };
    }

    if (recurrenceData.endType === 'after') {
        recurrenceData.occurrences = parseInt(document.getElementById('occurrences').value);
    } else if (recurrenceData.endType === 'on') {
        recurrenceData.endDate = document.getElementById('endDate').value;
    }

    return recurrenceData;
}

// Function to generate recurring dates
function generateRecurringDates(startDate, recurrenceData) {
    const dates = [];
    const start = new Date(startDate);
    
    if (!recurrenceData) return [startDate];

    if (recurrenceData.type === 'simple') {
        // Handle simple patterns (daily, weekly, monthly)
        // Implementation depends on your specific needs
    } else {
        // Handle custom patterns (e.g., 4 on 4 off)
        const totalDays = recurrenceData.customPattern.daysOn + recurrenceData.customPattern.daysOff;
        let currentDate = new Date(start);
        let daysAdded = 0;
        
        while (true) {
            const cycleDay = daysAdded % totalDays;
            
            if (cycleDay < recurrenceData.customPattern.daysOn) {
                dates.push(new Date(currentDate));
            }
            
            // Check end conditions
            if (recurrenceData.endType === 'after' && dates.length >= recurrenceData.occurrences) {
                break;
            } else if (recurrenceData.endType === 'on' && currentDate > new Date(recurrenceData.endDate)) {
                break;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
            daysAdded++;
        }
    }

    return dates;
}

// Initialize everything
window.onload = () => {
    initCalendar();
    filterTemplates('all'); // Start with all templates visible
    initializeTimeDropdowns();
    renderTemplates();
    addDragDropToDay();
    initializeModals();
}

// Add these functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function openRecurrenceModal() {
    const modal = document.getElementById('recurrenceModal');
    modal.style.display = 'block';
}

function togglePatternOptions() {
    const pattern = document.getElementById('recurrencePattern').value;
    document.getElementById('simplePattern').style.display = 
        pattern === 'simple' ? 'block' : 'none';
    document.getElementById('customPattern').style.display = 
        pattern === 'custom' ? 'block' : 'none';
}

function toggleEndOptions() {
    const endType = document.getElementById('endType').value;
    const occurrences = document.getElementById('occurrences');
    const endDate = document.getElementById('endDate');
    const endOptions = document.getElementById('endOptions');
    
    endOptions.style.display = endType === 'never' ? 'none' : 'block';
    occurrences.style.display = endType === 'after' ? 'block' : 'none';
    endDate.style.display = endType === 'on' ? 'block' : 'none';
}

function saveRecurrence() {
    // Get all recurrence data
    const recurrenceData = getRecurrenceData();
    // Store it somewhere (perhaps in a global variable or data attribute)
    currentRecurrenceSettings = recurrenceData;
    closeModal('recurrenceModal');
}

// Update window click handler for modals
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Add these functions
function confirmClearTemplates() {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal modal';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <h3>Clear Templates</h3>
            <p>Are you sure you want to delete all saved templates?</p>
            <p class="warning-text">This action cannot be undone!</p>
            <div class="confirm-actions">
                <button onclick="clearTemplates()" class="delete-btn">Yes, Clear Templates</button>
                <button onclick="closeConfirmModal()" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);
    confirmModal.style.display = 'block';
}

function clearTemplates() {
    templates = [];
    localStorage.setItem('templates', JSON.stringify(templates));
    renderTemplates();
    
    // Close the confirmation modal
    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal) {
        confirmModal.remove();
    }
}

function closeConfirmModal() {
    const modal = document.querySelector('.confirm-modal');
    if (modal) {
        modal.remove();
    }
} 