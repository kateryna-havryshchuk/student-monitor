// NAVIGATION BUTTONS HANDLING
document.getElementById('cms-logo').addEventListener('click', function () {
    window.location.href = 'index.html';
});

document.getElementById('notificationBtn').addEventListener('click', function () {
    window.location.href = 'messages.html';
});

document.getElementById('notificationBtn').addEventListener('click', function () {
    window.location.href = 'messages.html';
});

//CHECKBOXES
document.addEventListener('DOMContentLoaded', function () {
    const headerCheckbox = document.querySelector('thead th input[type="checkbox"]');
    if (headerCheckbox) {
        headerCheckbox.addEventListener('change', function () {
            const allCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = headerCheckbox.checked;
            });
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

    function updateActionButtonsState() {
        const selectedCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
        const editButtons = document.querySelectorAll('.editRowBtn');
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
            editButtons.forEach(button => {
                button.disabled = selectedCheckboxes.length > 0;
            });
        }
    }

    function createDeleteAllButton() {
        const actionsArea = document.querySelector('.table-actions') || document.getElementById('addBtn').parentElement;

        const deleteAllBtn = document.createElement('button');
        deleteAllBtn.id = 'deleteAllBtn';
        // deleteAllBtn.className = 'btn-danger';
        deleteAllBtn.className = 'deleteAllBtn';
        deleteAllBtn.textContent = 'Delete Selected';
        deleteAllBtn.style.display = 'none';
        deleteAllBtn.style.marginLeft = '15px';

        deleteAllBtn.addEventListener('click', function () {
            const selectedRows = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
            if (selectedRows.length > 0) {
                showDeleteConfirmModal(
                    `Are you sure you want to delete ${selectedRows.length} selected students?`,
                    function () {
                        selectedRows.forEach(checkbox => {
                            checkbox.closest('tr').remove();
                        });

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


    setupCheckboxListeners();

    const originalAddNewRow = window.addNewRow;
    window.addNewRow = function () {
        originalAddNewRow.apply(this, arguments);
        setupCheckboxListeners();
    };
});


//ANIMATION BELL
document.addEventListener('DOMContentLoaded', function () {
    const bellButton = document.querySelector('.notify-dropdown button');
    const bellIcon = document.getElementById('bellIcon');
    const notificationBadge = document.querySelector('.icon-button-badge');

    let notificationTriggered = false;

    bellButton.addEventListener('mouseenter', function () {
        if (!notificationTriggered) {
            bellIcon.classList.add('bell-ringing');

            bellIcon.addEventListener('animationend', function () {
                bellIcon.classList.remove('bell-ringing');

                notificationBadge.classList.add('show');
                notificationTriggered = true;
            }, { once: true });
        }
    });

});


// MODAL DISPLAY FUNCTIONS
function showModal(title) {
    if (!document.getElementById('studentModal')) {
        createModal();
    }


    document.getElementById('modalTitle').textContent = title;
    document.getElementById('studentModal').style.display = 'block';
    const okBtn = document.getElementById('okBtn');
    const createBtn = document.getElementById('createBtn');


    if (!okBtn.originalOnclick) {
        okBtn.originalOnclick = okBtn.onclick;
    }

    if (!createBtn.originalOnclick) {
        createBtn.originalOnclick = createBtn.onclick;
    }
    document.getElementById('studentForm').reset();

    createBtn.onclick = function () {
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
    okBtn.onclick = function () {
        const group = document.getElementById('group').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const gender = document.getElementById('gender').value;
        const birthday = document.getElementById('birthday').value;
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


// EDIT BUTTON SETUP AND HANDLING
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


// EDIT MODAL CONFIGURATION
function showEditModal(title, rowData, rowElement) {
    document.getElementById('modalTitle').textContent = title;


    const nameParts = rowData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const birthdayParts = rowData.birthday.split('.');
    const formattedBirthday = birthdayParts.length === 3 ?
        `${birthdayParts[2]}-${birthdayParts[1]}-${birthdayParts[0]}` : '';

    document.getElementById('group').value = rowData.group;
    document.getElementById('firstName').value = firstName;
    document.getElementById('lastName').value = lastName;
    document.getElementById('gender').value = rowData.gender;
    document.getElementById('birthday').value = formattedBirthday;

    document.getElementById('studentModal').style.display = 'block';

    const createBtn = document.getElementById('createBtn');
    const okBtn = document.getElementById('okBtn');

    if (!createBtn.originalOnclick) {
        createBtn.originalOnclick = createBtn.onclick;
    }

    if (!okBtn.originalOnclick) {
        okBtn.originalOnclick = okBtn.onclick;
    }

    createBtn.onclick = function () {
        updateStudentData(rowElement);
    };

    okBtn.onclick = function () {
        updateStudentData(rowElement);
        document.getElementById('studentModal').style.display = 'none';
    };
}


// DATA UPDATE FUNCTION
function updateStudentData(rowElement) {
    const group = document.getElementById('group').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;


    if (!group || !firstName || !lastName || !gender || !birthday) {
        alert('Please fill in all fields');
        return;
    }


    rowElement.cells[1].textContent = group;
    rowElement.cells[2].textContent = firstName + ' ' + lastName;
    rowElement.cells[3].textContent = gender;
    rowElement.cells[4].textContent = formatDate(birthday);


    document.getElementById('studentForm').reset();


    const createBtn = document.getElementById('createBtn');
    const okBtn = document.getElementById('okBtn');

    createBtn.onclick = createBtn.originalOnclick;
    okBtn.onclick = okBtn.originalOnclick;
}


// EDIT BUTTONS INITIALIZATION
document.addEventListener('DOMContentLoaded', function () {
    setupEditButtons();

    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        const observer = new MutationObserver(function () {
            setupEditButtons();
        });
        observer.observe(tableBody, { childList: true });
    }

    const originalAddNewRow = window.addNewRow;
    window.addNewRow = function () {
        originalAddNewRow.apply(this, arguments);
        setupEditButtons();
    };
});


// ADD BUTTON HANDLER
document.getElementById('addBtn').onclick = function () {
    if (!document.getElementById('studentModal')) {
        createModal().then(() => {
            showModal('Add student');
        });
    } else {
        showModal('Add student', null);
    }

}


// MODAL CREATION FUNCTION

// MODAL CREATION FUNCTION
function createModal() {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.id = 'studentModal';
        modal.classList.add('modal');

        fetch('addEditModal.html')
            .then(response => response.text())
            .then(html => {
                modal.innerHTML = html;
                document.body.appendChild(modal);


                setupModalEventListeners(modal);
                resolve();
                resolve();
            })
            .catch(error => {
                console.error('Error loading modal content:', error);
                reject(error);
            });
    });
}


// MODAL EVENT LISTENERS SETUP
function setupModalEventListeners(modal) {
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = function () {
        modal.style.display = 'none';
    }

    const group = document.getElementById('group').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;

    const okBtn = document.getElementById('okBtn');
    okBtn.onclick = function () {
        if (group && firstName && lastName && gender && birthday) {
            const formattedDate = formatDate(birthday);
            addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
            // document.getElementById('studentForm').reset();
            modal.style.display = 'none';
        } else {
            document.getElementById('studentForm').reset();
            modal.style.display = 'none';
        }
    };

    const createBtn = document.getElementById('createBtn');
    createBtn.onclick = function () {
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


    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// DATE FORMATTING UTILITY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}
// ROW CREATION FUNCTION
function addNewRow(group, name, gender, birthday) {
    const newRow = document.createElement('tr');
    let dotClass = 'inactive-dot';
    if (name === "Ket Jer") {
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

function addDeleteListener(button) {
    button.addEventListener('click', function () {
        const row = button.closest('tr');
        const studentName = row.querySelector('td:nth-child(3)').textContent;


        showDeleteConfirmModal(
            `Are you sure you want to delete user ${studentName} ?`,
            function () {
                row.remove();
            }
        );
    });
}


// $(document).ready(function () {
//     $('#studentsTable').paging({ limit: 7 });
// });


function showDeleteConfirmModal(message, onConfirm) {
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteConfirmText').innerHTML = message;

    modal.style.display = 'block';


    const newOkBtn = document.getElementById('newOkBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const closeBtn = modal.querySelector('.close-btn');

    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    closeBtn.replaceWith(closeBtn.cloneNode(true));

    const newCancelBtn = document.getElementById('cancelDeleteBtn');
    const newCloseBtn = modal.querySelector('.close-btn');


    function closeModal() {
        modal.style.display = 'none';
    }

    newOkBtn.addEventListener('click', function () {
        onConfirm();
        closeModal();
    });

    newOkBtn.addEventListener('click', closeModal);
    newCancelBtn.addEventListener('click', closeModal);
    newCloseBtn.addEventListener('click', closeModal);
}

