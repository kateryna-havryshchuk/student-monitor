// NAVIGATION BUTTONS HANDLING
document.getElementById('cms-logo').addEventListener('click', function () {
    window.location.href = 'index.html';
});

document.getElementById('notificationBtn').addEventListener('click', function () {
    window.location.href = 'messages.html';
});

// document.getElementById('notificationBtn').addEventListener('click', function () {
//     window.location.href = 'messages.html';
// });

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

    // function setupCheckboxListeners() {
    //     const tableCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
    //     tableCheckboxes.forEach(checkbox => {
    //         checkbox.removeEventListener('change', checkboxChangeHandler);
    //         checkbox.addEventListener('change', checkboxChangeHandler);
    //     });
    // }

    // function checkboxChangeHandler() {
    //     updateActionButtonsState();

    //     const allCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
    //     const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked);

    //     if (headerCheckbox) {
    //         headerCheckbox.checked = allChecked;
    //     }
    // }

    document.getElementById('tableBody').addEventListener('change', function (event) {
        // Check if the changed element is a checkbox
        if (event.target.matches('th input[type="checkbox"]')) {
            updateActionButtonsState();

            const allCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]');
            const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked);

            if (headerCheckbox) {
                headerCheckbox.checked = allChecked;
            }
        }
    });

    function updateActionButtonsState() {
        const selectedCheckboxes = document.querySelectorAll('#tableBody tr th input[type="checkbox"]:checked');
        const editButtons = document.querySelectorAll('.editRowBtn');

        // const deleteAllBtn = document.getElementById('deleteAllBtn') || createDeleteAllButton();

        let deleteAllBtn = document.getElementById('deleteAllBtn');
        if (!deleteAllBtn) {
            deleteAllBtn = createDeleteAllButton();
        }

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

    //щоб після додавання нового рядка оновлювалися чекбокси
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
        createModal().then(() => {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('studentModal').style.display = 'block';
        });
    } else {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('studentForm').reset();

        // Clear any existing error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());

        // Remove invalid class from all inputs
        const inputs = document.querySelectorAll('#studentForm input, #studentForm select');
        inputs.forEach(input => input.classList.remove('invalid'));

        const okBtn = document.getElementById('okBtn');
        const createBtn = document.getElementById('createBtn');
        createBtn.textContent = 'Create';

        // Restore original handlers for "Add" mode
        if (okBtn.originalOnclick) {
            okBtn.onclick = okBtn.originalOnclick;
        }
        if (createBtn.originalOnclick) {
            createBtn.onclick = createBtn.originalOnclick;
        }

        document.getElementById('studentModal').style.display = 'block';
    }
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

    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());

    const inputs = document.querySelectorAll('#studentForm input, #studentForm select');
    inputs.forEach(input => input.classList.remove('invalid'));

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

    const updateBtn = document.getElementById('createBtn');
    const okBtn = document.getElementById('okBtn');

    updateBtn.textContent = 'Update';

    // Save original handlers for "Add" mode
    if (!updateBtn.originalOnclick) {
        updateBtn.originalOnclick = updateBtn.onclick;
    }
    if (!okBtn.originalOnclick) {
        okBtn.originalOnclick = okBtn.onclick;
    }

    updateBtn.onclick = function() {
        if (validateForm(validationMethod)) {
            const group = document.getElementById('group').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const gender = document.getElementById('gender').value;
            const birthday = document.getElementById('birthday').value;

            rowElement.cells[1].textContent = group;
            rowElement.cells[2].textContent = firstName + ' ' + lastName;
            rowElement.cells[3].textContent = gender;
            rowElement.cells[4].textContent = formatDate(birthday);
        }
    };

    okBtn.onclick = function() {
        if (validateForm(validationMethod)) {
            const group = document.getElementById('group').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const gender = document.getElementById('gender').value;
            const birthday = document.getElementById('birthday').value;

            rowElement.cells[1].textContent = group;
            rowElement.cells[2].textContent = firstName + ' ' + lastName;
            rowElement.cells[3].textContent = gender;
            rowElement.cells[4].textContent = formatDate(birthday);

            document.getElementById('studentForm').reset();

            // Restore original handlers when closing
            createBtn.onclick = createBtn.originalOnclick;
            okBtn.onclick = okBtn.originalOnclick;

            document.getElementById('studentModal').style.display = 'none';
        }
    };
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
function createModal() {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.id = 'studentModal';
        modal.classList.add('modal');

        fetch('addEditModal.html')
            .then(response => response.text())
            .then(html => {
                html = html.replace(
                    '</form>',
                    '<input type="hidden" id="studentId" name="studentId" value="">\n</form>'
                );

                modal.innerHTML = html;
                document.body.appendChild(modal);

                setupFormValidation();
                setupModalEventListeners(modal);
                resolve();
            })
            .catch(error => {
                console.error('Error loading modal content:', error);
                reject(error);
            });
    });
}

// FORM VALIDATION METHODS

// Options: 'javascript', 'html', 'regex'
const validationMethod = 'javascript';

// Initialize validation based on selected method
document.addEventListener('DOMContentLoaded', function () {
    setupValidation(validationMethod);

    // Add form submission handler
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (validateForm(validationMethod)) {
                console.log('Form submitted successfully');
            }
        });
    }
});

// Setup validation based on method
function setupValidation(method) {
    const form = document.getElementById('studentForm');
    if (!form) return;

    // Remove any previous validation attributes/listeners
    clearValidationSetup();

    switch (method) {
        case 'html':
            setupHtmlValidation();
            break;
        case 'regex':
            setupRegexValidation();
            break;
        case 'javascript':
        default:
            setupJsValidation();
            break;
    }
}

// Clear previous validation setup
function clearValidationSetup() {
    const inputs = document.querySelectorAll('#studentForm input, #studentForm select');

    // Remove all validation attributes
    inputs.forEach(input => {
        input.removeAttribute('required');
        input.removeAttribute('pattern');
        input.removeAttribute('min');
        input.removeAttribute('max');
        input.removeAttribute('minlength');
        input.removeAttribute('maxlength');

        // Remove event listeners (by cloning and replacing)
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });

    // Remove existing error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

// METHOD 1: JavaScript validation
function setupJsValidation() {
    const fields = getValidationFields();

    Object.values(fields).forEach(field => {
        if (field.element) {
            field.element.addEventListener('input', function () {
                validateFieldJs(field);
            });

            field.element.addEventListener('blur', function () {
                validateFieldJs(field);
            });
        }
    });
}

function validateFieldJs(field) {
    if (!field.element) return true;

    const value = field.element.value;
    let isValid = true;

    if (field.pattern) {
        isValid = field.pattern.test(value);
    } else if (field.validate) {
        isValid = field.validate(value);
    }

    if (!isValid) {
        field.element.classList.add('invalid');
        showErrorMessage(field.element, field.errorMessage);
    } else {
        field.element.classList.remove('invalid');
        hideErrorMessage(field.element);
    }

    return isValid;
}


// METHOD 2: HTML validation
function setupHtmlValidation() {
    const form = document.getElementById('studentForm');

    // Group field
    const groupField = document.getElementById('group');
    groupField.setAttribute('required', 'true');

    // First name field
    const firstNameField = document.getElementById('firstName');
    firstNameField.setAttribute('required', 'true');
    firstNameField.setAttribute('pattern', '[A-Za-zА-Яа-я]{2,20}');
    firstNameField.setAttribute('title', 'FirstName must be 2-20 letters long');

    // Last name field
    const lastNameField = document.getElementById('lastName');
    lastNameField.setAttribute('required', 'true');
    lastNameField.setAttribute('pattern', '[A-Za-zА-Яа-я]{2,20}');
    lastNameField.setAttribute('title', 'Surname must be 2-20 letters long');

    // Gender field
    const genderField = document.getElementById('gender');
    genderField.setAttribute('required', 'true');

    // Birthday field
    const birthdayField = document.getElementById('birthday');
    birthdayField.setAttribute('required', 'true');

    // Calculate valid date range (16-90 years old)
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 90);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 16);

    birthdayField.setAttribute('min', minDate.toISOString().split('T')[0]);
    birthdayField.setAttribute('max', maxDate.toISOString().split('T')[0]);

    // Add custom validation message display
    form.addEventListener('invalid', function (event) {
        event.preventDefault();
        const element = event.target;
        element.classList.add('invalid');
        showErrorMessage(element, element.title || 'This field is required');
    }, true);

    // Clear validation message when input changes
    const inputs = document.querySelectorAll('#studentForm input, #studentForm select');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('invalid');
            hideErrorMessage(this);
        });
    });
}

// METHOD 3: Regex validation
function setupRegexValidation() {
    const fields = {
        group: {
            element: document.getElementById('group'),
            pattern: /^PZ-2[1-6]$/,
            errorMessage: 'Choose a valid group (PZ-21 to PZ-26)'
        },
        firstName: {
            element: document.getElementById('firstName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'FirstName must be 2-20 letters long'
        },
        lastName: {
            element: document.getElementById('lastName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'Surname must be 2-20 letters long'
        },
        gender: {
            element: document.getElementById('gender'),
            pattern: /^[MF]$/,
            errorMessage: 'Choose gender (M or F)'
        },
        birthday: {
            element: document.getElementById('birthday'),
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            validate: function (value) {
                if (!value) return false;

                // First check basic date format with regex
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

                // Then check age range
                const today = new Date();
                const birthDate = new Date(value);
                const age = today.getFullYear() - birthDate.getFullYear();

                // Ensure date is valid (not Feb 30, etc.)
                if (isNaN(birthDate.getTime())) return false;

                return age >= 16 && age <= 90;
            },
            errorMessage: 'Age must be between 16 and 90 years'
        }
    };

    Object.values(fields).forEach(field => {
        if (field.element) {
            field.element.addEventListener('input', function () {
                validateFieldRegex(field);
            });

            field.element.addEventListener('blur', function () {
                validateFieldRegex(field);
            });
        }
    });
}

function validateFieldRegex(field) {
    if (!field.element) return true;

    const value = field.element.value;
    let isValid = true;

    if (field.pattern) {
        isValid = field.pattern.test(value);
    }

    if (isValid && field.validate) {
        isValid = field.validate(value);
    }

    if (!isValid) {
        field.element.classList.add('invalid');
        showErrorMessage(field.element, field.errorMessage);
    } else {
        field.element.classList.remove('invalid');
        hideErrorMessage(field.element);
    }

    return isValid;
}

// Get validation field definitions
function getValidationFields() {
    return {
        group: {
            element: document.getElementById('group'),
            validate: function (value) {
                return value !== "";
            },
            errorMessage: 'Choose group'
        },
        firstName: {
            element: document.getElementById('firstName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'First name must be 2-20 letters long'
        },
        lastName: {
            element: document.getElementById('lastName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'Surname must be 2-20 letters long'
        },
        gender: {
            element: document.getElementById('gender'),
            validate: function (value) {
                return value !== "";
            },
            errorMessage: 'Choose gender'
        },
        birthday: {
            element: document.getElementById('birthday'),
            validate: function (value) {
                if (!value) return false;
                const today = new Date();
                const birthDate = new Date(value);
                const age = today.getFullYear() - birthDate.getFullYear();
                return age >= 16 && age <= 90;
            },
            errorMessage: 'Age must be between 16 and 90 years'
        }
    };
}

// Validate form based on selected method
function validateForm(method = validationMethod) {
    switch (method) {
        case 'html':
            return validateFormHtml();
        case 'regex':
            return validateFormRegex();
        case 'javascript':
        default:
            return validateFormJs();
    }
}

function validateFormJs() {
    const fields = getValidationFields();
    let isFormValid = true;

    Object.values(fields).forEach(field => {
        if (!validateFieldJs(field)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        console.log('Form validation failed');
    }
    return isFormValid;
}

function validateFormHtml() {
    const form = document.getElementById('studentForm');
    return form.checkValidity();
}

function validateFormRegex() {
    const fields = {
        group: {
            element: document.getElementById('group'),
            pattern: /^PZ-2[1-6]$/,
            errorMessage: 'Choose a valid group (PZ-21 to PZ-26)'
        },
        firstName: {
            element: document.getElementById('firstName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'FirstName must be 2-20 letters long'
        },
        lastName: {
            element: document.getElementById('lastName'),
            pattern: /^[A-Za-zА-Яа-я]{2,20}$/,
            errorMessage: 'Surname must be 2-20 letters long'
        },
        gender: {
            element: document.getElementById('gender'),
            pattern: /^[MF]$/,
            errorMessage: 'Choose gender (M or F)'
        },
        birthday: {
            element: document.getElementById('birthday'),
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            validate: function (value) {
                if (!value) return false;

                // First check basic date format with regex
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

                // Then check age range
                const today = new Date();
                const birthDate = new Date(value);
                const age = today.getFullYear() - birthDate.getFullYear();

                // Ensure date is valid (not Feb 30, etc.)
                if (isNaN(birthDate.getTime())) return false;

                return age >= 16 && age <= 90;
            },
            errorMessage: 'Age must be between 16 and 90 years'
        }
    };

    let isFormValid = true;

    Object.values(fields).forEach(field => {
        if (!validateFieldRegex(field)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        console.log('Form validation failed');
    }
    return isFormValid;
}

function showErrorMessage(element, message) {
    // If error message doesn't exist yet
    if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('error-message')) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        errorElement.textContent = message;
        element.parentNode.insertBefore(errorElement, element.nextSibling);
    }
}

function hideErrorMessage(element) {
    const errorElement = element.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.remove();
    }
}

// This replaces your original validateForm function
window.validateForm = validateForm;

window.setupFormValidation = function () {
    setupValidation(validationMethod);
};

const originalSetupModalEventListeners = window.setupModalEventListeners;
window.setupModalEventListeners = function (modal) {
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = function () {
        modal.style.display = 'none';
    }

    const okBtn = document.getElementById('okBtn');
    okBtn.onclick = function () {
        if (validateForm(validationMethod)) {
            const group = document.getElementById('group').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const gender = document.getElementById('gender').value;
            const birthday = document.getElementById('birthday').value;
            
            const formattedDate = formatDate(birthday);
            addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
            document.getElementById('studentForm').reset();
        }
        // Always close the modal regardless of validation result
        modal.style.display = 'none';
    };

    const createBtn = document.getElementById('createBtn');
    createBtn.onclick = function () {
        if (validateForm(validationMethod)) {
            const group = document.getElementById('group').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const gender = document.getElementById('gender').value;
            const birthday = document.getElementById('birthday').value;

            const formattedDate = formatDate(birthday);
            addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
            document.getElementById('studentForm').reset();
        }
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};

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

    // Generate a unique ID for the student (e.g., using Date.now())
    const studentId = Date.now().toString();

    let dotClass = 'inactive-dot';
    if (name === "Ket Jer") {
        dotClass = 'active-dot';
    }
    newRow.innerHTML = `
        <th><input type="checkbox" data-student-id="${studentId}"></th>
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

    // Json object to store student data
    const studentData = {
        id: studentId,
        group: group,
        name: name,
        gender: gender,
        birthday: birthday
    };

    // Log the student data to the console
    console.log('New Student Data:', JSON.stringify(studentData, null, 2));

    newRow.classList.add('tableRow');
    document.getElementById('tableBody').appendChild(newRow);
    const newDeleteButton = newRow.querySelector('.deleteRowBtn');


    addDeleteListener(newDeleteButton);
}

// Додаємо CSS для інвалідної форми
const style = document.createElement('style');
style.textContent = `
    .invalid {
        border: 2px solid red;
        background-color: #ffeeee;
    }
    .error-message {
        color: red;
        font-size: 0.8em;
        margin-top: 2px;
        margin-bottom: -2px;
    }
`;
document.head.appendChild(style);


// DELETE BUTTON HANDLER
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

