document.addEventListener("DOMContentLoaded", function() {
    // Modal elements (unchanged)
    const addModal = document.getElementById('addEditModal');
    const deleteModal = document.getElementById('deleteModal');
    const addBtn = document.getElementById('addBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const okBtn = document.getElementById('okBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const newOkBtn = document.getElementById('newOkBtn');
    const studentForm = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');

    // Notification elements (unchanged)
    const bellIcon = document.querySelector('#bellIcon');
    const notificationBtn = document.querySelector('#notificationBtn');
    const notifyContent = document.querySelector('#notifyContent');
    const badge = document.querySelector('.icon-button-badge');
    const notifyDropdown = document.querySelector('.notify-dropdown');

    // Notification logic (unchanged)
    if (notificationBtn && notifyContent && notifyDropdown && badge) {
        notifyDropdown.addEventListener('mouseover', function() {
            badge.classList.add('show');
        }, { once: true });

        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            notifyContent.style.display = notifyContent.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function(e) {
            if (!notificationBtn.contains(e.target) && !notifyContent.contains(e.target)) {
                notifyContent.style.display = 'none';
            }
        });
    }

    // Show add modal (unchanged)
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            resetForm();
            modalTitle.textContent = "Add student";
            addModal.style.display = 'block';
            clearErrors();
        });
    }

    // Close modal (unchanged)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            addModal.style.display = 'none';
            clearErrors();
        });
    }

    // Close delete modal (unchanged)
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }

    // Format date (unchanged)
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // Reset form (unchanged)
    function resetForm() {
        studentForm.reset();
        document.getElementById('studentId').value = '';
        clearErrors();
    }

    // Clear errors (unchanged)
    function clearErrors() {
        studentForm.querySelectorAll('input, select').forEach(field => field.classList.remove('error-input'));
        studentForm.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

    // Edit buttons (unchanged)
    document.querySelectorAll('.editRowBtn').forEach(btn => {
        btn.addEventListener('click', function() {
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
                    } else {
                        console.error('Failed to fetch student data:', data.message || 'Unknown error');
                    }
                })
                .catch(error => console.error('Error fetching student:', error));
        });
    });

    // Delete buttons (unchanged)
    document.querySelectorAll('.deleteRowBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            const studentName = this.getAttribute('data-name');
            document.getElementById('studentName').textContent = studentName;
            deleteModal.style.display = 'block';
            newOkBtn.replaceWith(newOkBtn.cloneNode(true));
            const freshNewOkBtn = document.getElementById('newOkBtn');
            freshNewOkBtn.addEventListener('click', function() {
                deleteStudent(studentId);
            });
        });
    });

    // Delete student (unchanged)
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
                location.reload();
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

    // Form submission (unchanged)
    if (okBtn && studentForm) {
        okBtn.replaceWith(okBtn.cloneNode(true));
        const freshOkBtn = document.getElementById('okBtn');
        freshOkBtn.addEventListener('click', function(e) {
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
                    location.reload();
                } else if (data.errors) {
                    clearErrors();
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
    }

    function updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        const someChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    // Select all functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            saveSelectedStudents();
        });
    }

    // Individual checkbox functionality
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveSelectedStudents();
            updateSelectAllState();
        });
    });

    // Load selected students on page load
    loadSelectedStudents();

    // Update checkbox event listeners after pagination
    function updateCheckboxListeners() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
        checkboxes.forEach(checkbox => {
            // Remove existing listeners to avoid duplicates
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            // Add new listener
            newCheckbox.addEventListener('change', function() {
                saveSelectedStudents();
                updateSelectAllState();
            });
        });
    }

    // Re-attach checkbox listeners after page content updates
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Delay to allow table to update
            setTimeout(updateCheckboxListeners, 100);
        });
    });

    // Initial call to ensure listeners are attached
    updateCheckboxListeners();
});