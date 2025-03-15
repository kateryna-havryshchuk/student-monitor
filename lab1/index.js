
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
    
    function setupCheckboxListeners() {
        const tableCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
        tableCheckboxes.forEach(checkbox => {
            checkbox.removeEventListener('change', checkboxChangeHandler);
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
        
        if (selectedCheckboxes.length > 0) {
            deleteAllBtn.style.display = 'inline-block';
            deleteAllBtn.textContent = `Delete Selected (${selectedCheckboxes.length})`;
        } else {
            deleteAllBtn.style.display = 'none';
        }
        
        if (selectedCheckboxes.length === 1) {
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
        
        deleteAllBtn.addEventListener('click', function() {
            const selectedRows = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
            if (selectedRows.length > 0) {
                showDeleteConfirmModal(
                    `Are you sure you want to delete ${selectedRows.length} selected students?`,
                    function() {
                        selectedRows.forEach(checkbox => {
                            checkbox.closest('tr').remove();
                        });
                        
                        // Reset header checkbox
                        const headerCheckbox = document.querySelector('thead th input[type="checkbox"]');
                        if (headerCheckbox) {
                            headerCheckbox.checked = false;
                        }
                        
                        deleteAllBtn.style.display = 'none';
                    }
                );
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

  function showModal(title, rowData) {
    // Create modal if it doesn't exist yet
    if (!document.getElementById('studentModal')) {
        createModal();
    }
    
    // Set modal title
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('studentModal').style.display = 'block';
    const okBtn = document.getElementById('okBtn');
    const createBtn = document.getElementById('createBtn');
    
    // Store original handlers if not already stored
    if (!okBtn.originalOnclick) {
        okBtn.originalOnclick = okBtn.onclick;
    }
    
    if (!createBtn.originalOnclick) {
        createBtn.originalOnclick = createBtn.onclick;
    }
        document.getElementById('studentForm').reset();
        
        createBtn.onclick = function() {
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
        // Set up behavior for adding new student
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
                document.getElementById('studentModal').style.display = 'none';
            } else {
                document.getElementById('studentModal').style.display = 'none';
            }
        };
    
    document.getElementById('studentModal').style.display = 'block';
}


function setupEditButtons() {
    const editButtons = document.querySelectorAll('.editRowBtn');
    editButtons.forEach(button => {
        button.removeEventListener('click', editButtonHandler);
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
    
    if (!document.getElementById('studentModal')) {
        createModal().then(() => {
            showEditModal('Edit student', rowData, row);
        });
    } else {
        showEditModal('Edit student', rowData, row);
    }
}


function showEditModal(title, rowData, rowElement) {
    document.getElementById('modalTitle').textContent = title;
    
    // Split the name into first and last name
    const nameParts = rowData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
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
        
        // $('#studentsTable').paging('refresh');

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
        modal.style.display = 'none';
    }

    const group = document.getElementById('group').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;

    const okBtn = document.getElementById('okBtn');
    okBtn.onclick = function() {
        if (group && firstName && lastName && gender && birthday) {
            const formattedDate = formatDate(birthday);
            addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
            console.log("huina");
            // document.getElementById('studentForm').reset();
            // Close the modal after adding student
            modal.style.display = 'none';
        } else {
            document.getElementById('studentForm').reset();
            modal.style.display = 'none';
        }
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

function addNewRow(group, name, gender, birthday) {
    const newRow = document.createElement('tr');
    let dotClass = 'inactive-dot';
    if(name === "Ket Jer"){
        dotClass = 'active-dot';
    }
    newRow.innerHTML = `
        <th><input type="checkbox"></th>
        <td>${group}</td>
        <td>${name}</td>
        <td>${gender}</td>
        <td>${birthday}</td>
        <td><span class="${dotClass}"></span></td>
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
    const newDeleteButton = newRow.querySelector('.deleteRowBtn');
    addDeleteListener(newDeleteButton);

}


let deleteButtons = document.querySelectorAll('.deleteRowBtn');
deleteButtons.forEach(button => addDeleteListener(button));

// function addDeleteListener(button) {
//     button.addEventListener('click', function() {
//         const row = button.closest('tr');
//         const studentName = row.querySelector('td:nth-child(3)').textContent;
        
//         // Update the modal with the student's name
//         document.getElementById('studentName').textContent = studentName;
        
//         // Show the modal
//         const modal = document.getElementById('deleteModal');
//         modal.style.display = 'block';
        
//         // Set up event listeners for modal buttons
//         const okBtn = document.getElementById('okBtn');
//         const cancelBtn = document.getElementById('cancelDeleteBtn');
//         const closeBtn = modal.querySelector('.close-btn');
        
//         // Function to close the modal
//         const closeModal = function() {
//             modal.style.display = 'none';
//             // Remove event listeners to prevent memory leaks
//             okBtn.removeEventListener('click', handleDelete);
//             cancelBtn.removeEventListener('click', closeModal);
//             closeBtn.removeEventListener('click', closeModal);
//         };
        
//         // Function to handle deletion
//         const handleDelete = function() {
//             row.remove();
//             closeModal();
//         };
        
//         // Add event listeners to buttons
//         okBtn.addEventListener('click', handleDelete);
//         cancelBtn.addEventListener('click', closeModal);
//         closeBtn.addEventListener('click', closeModal);
//     });
// }

// Function for individual row deletion
function addDeleteListener(button) {
    button.addEventListener('click', function() {
        const row = button.closest('tr');
        const studentName = row.querySelector('td:nth-child(3)').textContent;
        
        // Show confirmation modal
        showDeleteConfirmModal(
            `Are you sure you want to delete user ${studentName} ?`,
            function() {
                row.remove();
                // $('#studentsTable').paging('refresh');
            }
        );
    });
}



// Initialize paging (keeping your existing code)
$(document).ready(function(){
    $('#studentsTable').paging({limit: 7});
});


// Global function to show delete confirmation modal
function showDeleteConfirmModal(message, onConfirm) {
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteConfirmText').innerHTML = message;
    
    modal.style.display = 'block';
    
    // Set up event listeners for modal buttons
    const newOkBtn = document.getElementById('newOkBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const closeBtn = modal.querySelector('.close-btn');
    
    // Remove any existing event listeners
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    closeBtn.replaceWith(closeBtn.cloneNode(true));

    const newCancelBtn = document.getElementById('cancelDeleteBtn');
    const newCloseBtn = modal.querySelector('.close-btn');
    
    // Function to close the modal
    function closeModal() {
        modal.style.display = 'none';
    }
    
    // Add new event listeners
    newOkBtn.addEventListener('click', function() {
        onConfirm();
        closeModal();
    });
    
    newOkBtn.addEventListener('click', closeModal);
    newCancelBtn.addEventListener('click', closeModal);
    newCloseBtn.addEventListener('click', closeModal);
}

