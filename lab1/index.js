
document.getElementById('cms-logo').addEventListener('click', function() {
    window.location.href = 'students.html';
});

document.getElementById('notificationBtn').addEventListener('click', function() {
    window.location.href = 'messages.html';
});

document.getElementById('notificationBtn').addEventListener('click', function() {
    window.location.href = 'messages.html';
});

//CHECKBOXES

document.addEventListener('DOMContentLoaded', function() {
    const headerCheckbox = document.querySelector('thead th input[type="checkbox"]');
    if (headerCheckbox) {
        headerCheckbox.addEventListener('change', function() {
            // Select or deselect all checkboxes based on header checkbox state
            const allCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = headerCheckbox.checked;
            });
            // Update the action buttons state
            updateActionButtonsState();
        });
    }
    
    // Function to observe the table body for new rows and add checkbox event listeners
    function setupCheckboxListeners() {
        const tableCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
        tableCheckboxes.forEach(checkbox => {
            // Remove existing listener first to prevent duplicates
            checkbox.removeEventListener('change', checkboxChangeHandler);
            // Add the event listener
            checkbox.addEventListener('change', checkboxChangeHandler);
        });
    }
    
    function checkboxChangeHandler() {
        updateActionButtonsState();
        
        const allCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
        const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked);
        
        if (headerCheckbox) {
            headerCheckbox.checked = allChecked;
        }
    }
    
    // Function to update action buttons state based on selection
    function updateActionButtonsState() {
        const selectedCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
        const editButtons = document.querySelectorAll('.editRowBtn');
        const deleteButtons = document.querySelectorAll('.deleteRowBtn');
        const deleteAllBtn = document.getElementById('deleteAllBtn') || createDeleteAllButton();
        
        // Show or hide delete all button
        if (selectedCheckboxes.length > 0) {
            deleteAllBtn.style.display = 'inline-block';
            deleteAllBtn.textContent = `Delete Selected (${selectedCheckboxes.length})`;
        } else {
            deleteAllBtn.style.display = 'none';
        }
        
        // Enable/disable individual edit buttons based on selection
        if (selectedCheckboxes.length === 1) {
            // Enable edit only for the selected row
            const selectedRow = selectedCheckboxes[0].closest('tr');
            editButtons.forEach(button => {
                if (button.closest('tr') === selectedRow) {
                    button.disabled = false;
                } else {
                    button.disabled = true;
                }
            });
        } else {
            // If multiple or none selected, disable all edit buttons
            editButtons.forEach(button => {
                button.disabled = selectedCheckboxes.length > 0;
            });
        }
    }
    
    // Function to create the delete all button if it doesn't exist
    function createDeleteAllButton() {
        const actionsArea = document.querySelector('.table-actions') || document.getElementById('addBtn').parentElement;
        
        const deleteAllBtn = document.createElement('button');
        deleteAllBtn.id = 'deleteAllBtn';
        deleteAllBtn.className = 'btn-danger';
        deleteAllBtn.textContent = 'Delete Selected';
        deleteAllBtn.style.display = 'none';
        deleteAllBtn.style.marginLeft = '15px';
        
        // Add event listener for delete all
        deleteAllBtn.addEventListener('click', function() {
            const selectedRows = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
            if (selectedRows.length > 0) {
                if (confirm(`Are you sure you want to delete ${selectedRows.length} selected students?`)) {
                    selectedRows.forEach(checkbox => {
                        checkbox.closest('tr').remove();
                    });
                    
                    // Reset header checkbox
                    if (headerCheckbox) {
                        headerCheckbox.checked = false;
                    }
                    
                    // Refresh paging
                    $('#studentsTable').paging('refresh');
                    
                    // Hide delete all button
                    deleteAllBtn.style.display = 'none';
                }
            }
        });
        
        actionsArea.appendChild(deleteAllBtn);
        return deleteAllBtn;
    }
    
    // Initial setup
    setupCheckboxListeners();
    
    // Set up a mutation observer to watch for new rows being added to the table
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        const observer = new MutationObserver(function(mutations) {
            setupCheckboxListeners();
        });
        
        observer.observe(tableBody, { childList: true });
    }
    
    // Add this to your existing addNewRow function to ensure new checkboxes have event listeners
    const originalAddNewRow = window.addNewRow;
    window.addNewRow = function() {
        // Call the original function
        originalAddNewRow.apply(this, arguments);
        
        // Setup checkbox listeners for the new row
        setupCheckboxListeners();
    };
});



//ANIMATION BELL
document.addEventListener('DOMContentLoaded', function() {
    const bellButton = document.querySelector('.notify-dropdown button');
    const bellIcon = document.getElementById('bellIcon');
    const notificationBadge = document.querySelector('.icon-button-badge');
    
    let notificationTriggered = false;
    
    bellButton.addEventListener('mouseenter', function() {
      // Only animate if notification hasn't been triggered yet
      if (!notificationTriggered) {
        bellIcon.classList.add('bell-ringing');
        
        bellIcon.addEventListener('animationend', function() {
          bellIcon.classList.remove('bell-ringing');
          
          notificationBadge.classList.add('show');
          notificationTriggered = true;
        }, { once: true });
      }
    });
    
  });



// Function to show modal with appropriate title and data
function showModal(title, rowData) {
    // Create modal if it doesn't exist yet
    if (!document.getElementById('studentModal')) {
        createModal();
    }
    
    // Set modal title
    document.getElementById('modalTitle').textContent = title;
    
    // Clear form fields if adding new student
    if (!rowData) {
        document.getElementById('studentForm').reset();
    }
    
    document.getElementById('studentModal').style.display = 'block';
}

// Add event listeners to edit buttons
function setupEditButtons() {
    const editButtons = document.querySelectorAll('.editRowBtn');
    editButtons.forEach(button => {
        // Remove existing listeners to prevent duplication
        button.removeEventListener('click', editButtonHandler);
        // Add click event listener
        button.addEventListener('click', editButtonHandler);
    });
}

function editButtonHandler(event) {
    const row = event.currentTarget.closest('tr');
    const rowData = {
        group: row.cells[1].textContent,
        name: row.cells[2].textContent,
        gender: row.cells[3].textContent,
        birthday: row.cells[4].textContent
    };
    
    // Check if modal already exists
    if (!document.getElementById('studentModal')) {
        // Create modal first, then show it when ready
        createModal().then(() => {
            showEditModal('Edit student', rowData, row);
        });
    } else {
        // Modal already exists, show it directly
        showEditModal('Edit student', rowData, row);
    }
}

// Function to show edit modal with pre-filled data
function showEditModal(title, rowData, rowElement) {
    // Set modal title
    document.getElementById('modalTitle').textContent = title;
    
    // Split the name into first and last name
    const nameParts = rowData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert date from DD.MM.YYYY to YYYY-MM-DD for input field
    const birthdayParts = rowData.birthday.split('.');
    const formattedBirthday = birthdayParts.length === 3 ? 
        `${birthdayParts[2]}-${birthdayParts[1]}-${birthdayParts[0]}` : '';
    
    // Fill form fields with data
    document.getElementById('group').value = rowData.group;
    document.getElementById('firstName').value = firstName;
    document.getElementById('lastName').value = lastName;
    document.getElementById('gender').value = rowData.gender;
    document.getElementById('birthday').value = formattedBirthday;
    
    // Show the modal
    document.getElementById('studentModal').style.display = 'block';
    
    // Change button functionality for edit mode
    const createBtn = document.getElementById('createBtn');
    const okBtn = document.getElementById('okBtn');
    
    // Store the original onclick handlers if not already stored
    if (!createBtn.originalOnclick) {
        createBtn.originalOnclick = createBtn.onclick;
    }
    
    if (!okBtn.originalOnclick) {
        okBtn.originalOnclick = okBtn.onclick;
    }
    
    // Replace with update functionality
    createBtn.onclick = function() {
        updateStudentData(rowElement);
    };
    
    okBtn.onclick = function() {
        updateStudentData(rowElement);
        document.getElementById('studentModal').style.display = 'none';
    };
}

// Function to update student data
function updateStudentData(rowElement) {
    const group = document.getElementById('group').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;
    
    // Validate all fields are filled
    if (!group || !firstName || !lastName || !gender || !birthday) {
        alert('Please fill in all fields');
        return;
    }
    
    // Update the row with new data
    rowElement.cells[1].textContent = group;
    rowElement.cells[2].textContent = firstName + ' ' + lastName;
    rowElement.cells[3].textContent = gender;
    rowElement.cells[4].textContent = formatDate(birthday);
    
    // Reset form
    document.getElementById('studentForm').reset();
    
    // Reset button functionality to original
    const createBtn = document.getElementById('createBtn');
    const okBtn = document.getElementById('okBtn');
    
    createBtn.onclick = createBtn.originalOnclick;
    okBtn.onclick = okBtn.originalOnclick;
}

// Initialize edit buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEditButtons();
    
    // Set up a mutation observer to watch for new rows being added to the table
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        const observer = new MutationObserver(function(mutations) {
            setupEditButtons();
        });
        
        observer.observe(tableBody, { childList: true });
    }
    
    // Modify addNewRow function to setup edit buttons
    const originalAddNewRow = window.addNewRow;
    window.addNewRow = function() {
        originalAddNewRow.apply(this, arguments);
        setupEditButtons();
    };
});

// Add modal functionality for adding students
document.getElementById('addBtn').onclick = function() {
    // Check if modal already exists
    if (!document.getElementById('studentModal')) {
        // Create modal first, then show it when ready
        createModal().then(() => {
            showModal('Add student', null);
        });
    } else {
        // Modal already exists, show it directly
        showModal('Add student', null);
    }
}

// Modified createModal to return a promise
function createModal() {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.id = 'studentModal';
        modal.classList.add('modal');
        
        // Fetch the modal content from the separate HTML file
        fetch('addEditModal.html')
            .then(response => response.text())
            .then(html => {
                modal.innerHTML = html;
                document.body.appendChild(modal);
                
                // Set up event listeners after the modal is loaded
                setupModalEventListeners(modal);
                resolve(); // Resolve the promise once modal is ready
            })
            .catch(error => {
                console.error('Error loading modal content:', error);
                reject(error);
            });
    });
}

function setupModalEventListeners(modal) {
    // Close button functionality
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = function() {
        closeModal();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    const okBtn = document.getElementById('okBtn');
    okBtn.onclick = function() {
    const group = document.getElementById('group').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;
    
    // Check if ALL fields are filled
    if (group && firstName && lastName && gender && birthday) {
        const formattedDate = formatDate(birthday);
        addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
        
        document.getElementById('studentForm').reset();
    }
    closeModal();
};

  // Create button functionality - validate and add new row
  const createBtn = document.getElementById('createBtn');
  createBtn.onclick = function() {
      // Get form values
      const group = document.getElementById('group').value;
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const gender = document.getElementById('gender').value;
      const birthday = document.getElementById('birthday').value;
      
      if (!group || !firstName || !lastName || !gender || !birthday) {
          alert('Please fill in all fields');
          return;
      }
      
      const formattedDate = formatDate(birthday);
      
      addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);

      document.getElementById('studentForm').reset();
  };


    
    // Close if clicking outside the modal
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Helper function to format date from YYYY-MM-DD to DD.MM.YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Function to add new row to the table
function addNewRow(group, name, gender, birthday) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <th><input type="checkbox"></th>
        <td>${group}</td>
        <td>${name}</td>
        <td>${gender}</td>
        <td>${birthday}</td>
        <td><span class="active-dot"></span></td>
        <td>
            <button class="editRowBtn">
                <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="deleteRowBtn">
                <i class="fa-solid fa-xmark fa-lg"></i>
            </button>
        </td>
    `;

    newRow.classList.add('tableRow');
    document.getElementById('tableBody').appendChild(newRow);
    
    // Add delete functionality to the new row's delete button
    const newDeleteButton = newRow.querySelector('.deleteRowBtn');
    addDeleteListener(newDeleteButton);
    
    // Refresh paging
    $('#studentsTable').paging('refresh');
}

// Delete row functionality (keeping your existing code)
let deleteButtons = document.querySelectorAll('.deleteRowBtn');
deleteButtons.forEach(button => addDeleteListener(button));

function addDeleteListener(button) {
    button.addEventListener('click', function() {
        const row = button.closest('tr');
        row.remove();
        $('#studentsTable').paging('refresh');
    });
}

// Initialize paging (keeping your existing code)
$(document).ready(function(){
    $('#studentsTable').paging({limit: 7});
});

