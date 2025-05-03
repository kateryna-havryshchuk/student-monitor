document.addEventListener("DOMContentLoaded", function () {
    // Modal elements
    const addModal = document.getElementById('addEditModal');
    const deleteModal = document.getElementById('deleteModal');
    const addBtn = document.getElementById('addBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const okBtn = document.getElementById('okBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const newOkBtn = document.getElementById('newOkBtn');
    const studentForm = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');
    const duplicateError = document.getElementById('duplicate-error');

    // Notification elements
    const bellIcon = document.querySelector('#bellIcon');
    const notificationBtn = document.querySelector('#notificationBtn');
    const notifyContent = document.querySelector('.notify-content');
    const badge = document.querySelector('.icon-button-badge');
    const notifyDropdown = document.querySelector('.notify-dropdown');

    // Table elements
    const tableBody = document.getElementById('tableBody');
    const studentsTable = document.getElementById('studentsTable');
    const pagingNav = document.querySelector('.paging-nav');

    const cmsLogo = document.getElementById('cms-logo');
    if (cmsLogo) {
        cmsLogo.addEventListener('click', function () {
            window.location.href = '/lab1/index.php?url=home/index';
        });
    }
    
    // Auto-capitalize first letter in name fields
    document.addEventListener("DOMContentLoaded", function () {
        // Function to capitalize the first letter
        function capitalizeFirstLetter(input) {
            // Skip if input is empty
            if (!input.value) return;

            // Capitalize the first letter of each word
            input.value = input.value
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Function to handle input events
        function handleInputEvent(e) {
            const input = e.target;

            // Handle when a user enters a space (for multi-word names)
            if (e == null || e.data === ' ') {
                capitalizeFirstLetter(input);
            }
            // Handle initial character
            else if (input.value.length === 1) {
                input.value = input.value.toUpperCase();
            }
        }

        // Apply to student form first name and last name fields
        const studentFirstName = document.getElementById('firstName');
        const studentLastName = document.getElementById('lastName');

        // Apply to signup form fields
        const signupFirstName = document.getElementById('firstname');
        const signupLastName = document.getElementById('lastname');

        // Attach event listeners to student form fields if they exist
        if (studentFirstName) {
            studentFirstName.addEventListener('input', handleInputEvent);
            studentFirstName.addEventListener('blur', function () {
                capitalizeFirstLetter(this);
            });
        }

        if (studentLastName) {
            studentLastName.addEventListener('input', handleInputEvent);
            studentLastName.addEventListener('blur', function () {
                capitalizeFirstLetter(this);
            });
        }

        // Attach event listeners to signup form fields if they exist
        if (signupFirstName) {
            signupFirstName.addEventListener('input', handleInputEvent);
            signupFirstName.addEventListener('blur', function () {
                capitalizeFirstLetter(this);
            });
        }

        if (signupLastName) {
            signupLastName.addEventListener('input', handleInputEvent);
            signupLastName.addEventListener('blur', function () {
                capitalizeFirstLetter(this);
            });
        }
    });

    // Current page tracker
    let currentPage = 1;

    // Delete selected button setup
    const tableActionArea = document.querySelector('#addBtn')?.parentNode;
    if (tableActionArea) {
        const deleteSelectedBtn = document.createElement('button');
        deleteSelectedBtn.id = 'deleteSelectedBtn';
        deleteSelectedBtn.className = 'btn btn-danger ms-2';
        deleteSelectedBtn.innerHTML = '<i class="bi bi-trash"></i> Delete Selected';
        deleteSelectedBtn.style.display = 'none'; // Initially hidden
        tableActionArea.appendChild(deleteSelectedBtn);

        // Delete selected button event listener
        deleteSelectedBtn.addEventListener('click', function () {
            const selectedStudents = JSON.parse(localStorage.getItem('selectedStudents') || '[]');
            if (selectedStudents.length === 0) {
                alert('No students selected');
                return;
            }

            // Create a message showing how many students will be deleted
            document.getElementById('studentName').textContent = `${selectedStudents.length} selected students`;
            deleteModal.style.display = 'block';

            // Replace the deleteConfirmBtn to avoid multiple event listeners
            newOkBtn.replaceWith(newOkBtn.cloneNode(true));
            const freshNewOkBtn = document.getElementById('newOkBtn');

            // Add event listener for the new button
            freshNewOkBtn.addEventListener('click', function () {
                deleteMultipleStudents(selectedStudents);
            });
        });
    }

    // Notification logic
    if (notificationBtn && notifyContent && notifyDropdown && badge) {
        notifyDropdown.addEventListener('mouseover', function () {
            badge.classList.add('show');
        }, { once: true });

        notificationBtn.addEventListener('click', function (e) {
            e.preventDefault();
            notifyContent.style.display = notifyContent.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function (e) {
            if (!notificationBtn.contains(e.target) && !notifyContent.contains(e.target)) {
                notifyContent.style.display = 'none';
            }
        });
    }

    // Show add modal
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            resetForm();
            modalTitle.textContent = "Add student";
            addModal.style.display = 'block';
            clearErrors();
            duplicateError.style.display = 'none';
            duplicateError.textContent = '';
        });
    }

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            addModal.style.display = 'none';
            clearErrors();
            duplicateError.style.display = 'none';
            duplicateError.textContent = '';
        });
    }

    // Close delete modal
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function () {
            deleteModal.style.display = 'none';
        });
    }

    // Format date
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // Format date for display
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).split('/').join('.');
    }

    // Reset form
    function resetForm() {
        studentForm.reset();
        document.getElementById('studentId').value = '';
        clearErrors();
        duplicateError.style.display = 'none';
        duplicateError.textContent = '';
    }

    // Clear errors
    function clearErrors() {
        studentForm.querySelectorAll('input, select').forEach(field => field.classList.remove('error-input'));
        studentForm.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

    // Load students for a specific page
    function loadStudents(page = 1) {
        // Show loading indicator
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
        }

        // Fetch students for the specified page
        fetch(`/lab1/index.php?url=student/getStudentsAjax&page=${page}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    updateStudentTable(data.students);
                    updatePagination(data.currentPage, data.totalPages);
                    currentPage = data.currentPage;
                    setupRowEventListeners();
                    loadSelectedStudents();
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading students</td></tr>';
                    console.error('Failed to load students:', data.message || 'Unknown error');
                }
            })
            .catch(error => {
                console.error('Error loading students:', error);
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading students</td></tr>';
                }
            });
    }

    // Update student table with new data
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function updateStudentTable(students) {
        if (!tableBody) return;

        if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No students found</td></tr>';
            return;
        }

        let html = '';
        students.forEach(student => {
            const fullName = `${capitalizeFirstLetter(student.firstname)} ${capitalizeFirstLetter(student.lastname)}`;
            const formattedDate = formatDateForDisplay(student.birthday);
            const isLoggedIn = !!document.querySelector('.userBtn'); // Check if user is logged in
            const statusDot = student.isActive ? '<span class="active-dot"></span>' : '<span class="inactive-dot"></span>';

            html += `
                <tr class="tableRow">
                    <th>
                        <input type="checkbox" id="select${student.id}" data-id="${student.id}">
                        <label for="select${student.id}" class="visually-hidden">Select one</label>
                    </th>
                    <td>${student.student_group}</td>
                    <td>${fullName}</td>
                    <td>${student.gender}</td>
                    <td>${formattedDate}</td>
                    <td>${statusDot}</td>
                    <td>
                        ${isLoggedIn ? `
                            <button class="editRowBtn" data-id="${student.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="deleteRowBtn" data-id="${student.id}" data-name="${fullName}">
                                <i class="fa-solid fa-xmark fa-lg"></i>
                            </button>
                        ` : '<span class="no-access">N/A</span>'}
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // Update pagination controls
    function updatePagination(currentPage, totalPages) {
        if (!pagingNav) return;

        if (totalPages <= 1) {
            pagingNav.style.display = 'none';
            return;
        }

        pagingNav.style.display = 'flex';
        let html = '';

        // Previous page button
        html += `<a href="#" class="page-link ${currentPage <= 1 ? 'disabled' : ''}" data-page="${Math.max(1, currentPage - 1)}">
                    <i class="fa-solid fa-angle-left"></i>
                </a>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `<a href="#" class="page-link ${i === currentPage ? 'selected-page' : ''}" data-page="${i}">${i}</a>`;
        }

        // Next page button
        html += `<a href="#" class="page-link ${currentPage >= totalPages ? 'disabled' : ''}" data-page="${Math.min(totalPages, currentPage + 1)}">
                    <i class="fa-solid fa-angle-right"></i>
                </a>`;

        pagingNav.innerHTML = html;

        // Add event listeners to pagination links
        pagingNav.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                if (page && !this.classList.contains('disabled')) {
                    loadStudents(parseInt(page));
                }
            });
        });
    }

    // Setup event listeners for edit and delete buttons in rows
    function setupRowEventListeners() {
        // Edit buttons
        document.querySelectorAll('.editRowBtn').forEach(btn => {
            btn.addEventListener('click', function () {
                const studentId = this.getAttribute('data-id');
                fetch(`/lab1/index.php?url=student/handleApi&action=getStudent&id=${studentId}`)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        console.log('Get Student Response:', data);
                        if (data.success) {
                            const student = data.student;
                            document.getElementById('studentId').value = student.id;
                            document.getElementById('group').value = student.student_group;
                            document.getElementById('firstName').value = student.firstname;
                            document.getElementById('lastName').value = student.lastname;
                            document.getElementById('gender').value = student.gender;
                            document.getElementById('birthday').value = formatDateForInput(student.birthday);
                            modalTitle.textContent = "Edit student";
                            addModal.style.display = 'block';
                            clearErrors();
                            duplicateError.style.display = 'none';
                            duplicateError.textContent = '';
                        } else {
                            console.error('Failed to fetch student data:', data.message || 'Unknown error');
                        }
                    })
                    .catch(error => console.error('Error fetching student:', error));
            });
        });

        // Delete buttons
        document.querySelectorAll('.deleteRowBtn').forEach(btn => {
            btn.addEventListener('click', function () {
                const studentId = this.getAttribute('data-id');
                const studentName = this.getAttribute('data-name');
                document.getElementById('studentName').textContent = studentName;
                deleteModal.style.display = 'block';
                newOkBtn.replaceWith(newOkBtn.cloneNode(true));
                const freshNewOkBtn = document.getElementById('newOkBtn');
                freshNewOkBtn.addEventListener('click', function () {
                    deleteStudent(studentId);
                });
            });
        });

        // Update checkbox listeners
        updateCheckboxListeners();
    }

    // Delete student
    function deleteStudent(id) {
        fetch('/lab1/index.php?url=student/handleApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Delete Student Response:', data);
                if (data.success) {
                    // Remove from selected students in LocalStorage
                    const selectedStudents = JSON.parse(localStorage.getItem('selectedStudents') || '[]');
                    const updatedSelection = selectedStudents.filter(sid => sid !== id);
                    localStorage.setItem('selectedStudents', JSON.stringify(updatedSelection));

                    // Reload current page
                    loadStudents(currentPage);
                } else {
                    console.error('Failed to delete student:', data.message || 'Unknown error');
                }
                deleteModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error deleting student:', error);
                deleteModal.style.display = 'none';
            });
    }

    // Delete multiple students
    function deleteMultipleStudents(ids) {
        fetch('/lab1/index.php?url=student/handleApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteMultiple', ids: ids })
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Delete Multiple Students Response:', data);
                if (data.success) {
                    // Clear selected students in LocalStorage
                    localStorage.setItem('selectedStudents', JSON.stringify([]));

                    // Reload current page or go to first page if no results left
                    loadStudents(currentPage);
                } else {
                    console.error('Failed to delete students:', data.message || 'Unknown error');
                }
                deleteModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error deleting students:', error);
                deleteModal.style.display = 'none';
            });
    }

    // Form submission
    if (okBtn && studentForm) {
        okBtn.replaceWith(okBtn.cloneNode(true));
        const freshOkBtn = document.getElementById('okBtn');
        freshOkBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const studentId = document.getElementById('studentId').value;
            const action = studentId ? 'update' : 'add';
            const formData = {
                action: action,
                id: studentId,
                group: document.getElementById('group').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                gender: document.getElementById('gender').value,
                birthday: document.getElementById('birthday').value
            };
            console.log('Form Data Sent:', formData);
            fetch('/lab1/index.php?url=student/handleApi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
                .then(response => {
                    console.log('Response Status:', response.status);
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('Server Response:', data);
                    if (data.success) {
                        resetForm();
                        addModal.style.display = 'none';
                        // Reload current page to show updated data
                        loadStudents(currentPage);
                    } else if (data.duplicate) {
                        duplicateError.textContent = data.message;
                        duplicateError.style.display = 'block';
                    } else if (data.errors) {
                        clearErrors();
                        duplicateError.style.display = 'none';
                        duplicateError.textContent = '';
                        Object.entries(data.errors).forEach(([field, error]) => {
                            console.log(`Setting error for ${field}: ${error}`);
                            const errorElement = document.getElementById(`${field}-error`);
                            const inputElement = document.getElementById(field);
                            if (errorElement && inputElement) {
                                errorElement.textContent = error;
                                errorElement.style.display = 'block';
                                inputElement.classList.add('error-input');
                            } else {
                                console.error(`Could not find elements for field ${field}`);
                            }
                        });
                    } else {
                        console.error('Unexpected response format:', data);
                    }
                })
                .catch(error => console.error('Error submitting form:', error));
        });
    }

    // Checkbox state management
    function loadSelectedStudents() {
        const selectedStudents = JSON.parse(localStorage.getItem('selectedStudents') || '[]');
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        checkboxes.forEach(checkbox => {
            const studentId = checkbox.getAttribute('data-id');
            checkbox.checked = selectedStudents.includes(studentId);
        });
        updateSelectAllState();
        updateDeleteSelectedButtonVisibility();
    }

    function updateDeleteSelectedButtonVisibility() {
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (!deleteSelectedBtn) return;

        const selectedStudents = JSON.parse(localStorage.getItem('selectedStudents') || '[]');
        if (selectedStudents.length > 0) {
            deleteSelectedBtn.style.display = 'inline-block';
        } else {
            deleteSelectedBtn.style.display = 'none';
        }
    }

    function saveSelectedStudents() {
        // Get current page's selected checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        const currentPageSelected = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.getAttribute('data-id'));

        // Get existing selections from LocalStorage
        const existingSelections = JSON.parse(localStorage.getItem('selectedStudents') || '[]');

        // Merge selections: keep existing selections, add new ones, remove unchecked ones
        const updatedSelections = [
            ...new Set([
                ...existingSelections.filter(id => !checkboxes.length || !Array.from(checkboxes).some(cb => cb.getAttribute('data-id') === id && !cb.checked)),
                ...currentPageSelected
            ])
        ];

        // Save updated selections to LocalStorage
        localStorage.setItem('selectedStudents', JSON.stringify(updatedSelections));

        // Update delete button visibility
        updateDeleteSelectedButtonVisibility();
    }

    function updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAll');
        if (!selectAllCheckbox) return;

        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        const someChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);

        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    // Select all functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        // Remove existing listeners to avoid duplicates
        const newSelectAllCheckbox = selectAllCheckbox.cloneNode(true);
        selectAllCheckbox.parentNode.replaceChild(newSelectAllCheckbox, selectAllCheckbox);

        // Add new listener
        newSelectAllCheckbox.addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            saveSelectedStudents();
        });
    }

    // Update checkbox event listeners
    function updateCheckboxListeners() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        checkboxes.forEach(checkbox => {
            // Remove existing listeners to avoid duplicates
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);

            // Add new listener
            newCheckbox.addEventListener('change', function () {
                saveSelectedStudents();
                updateSelectAllState();
            });
        });
    }

    // Initial load of students
    loadStudents();
});