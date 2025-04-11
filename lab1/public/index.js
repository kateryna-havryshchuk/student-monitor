document.addEventListener("DOMContentLoaded", function() {
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
    
    // Show add modal when clicking the add button
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            resetForm();
            modalTitle.textContent = "Add student";
            addModal.style.display = 'block';
        });
    }
    
    // Close modal when clicking X
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            addModal.style.display = 'none';
        });
    }
    
    // Close delete modal when clicking cancel
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addModal) {
            addModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // Format date for display
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
    
    // Reset form values
    function resetForm() {
        studentForm.reset();
        document.getElementById('studentId').value = '';
    }
    
    // Event listeners for edit buttons
    document.querySelectorAll('.editRowBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            
            // Fetch student data
            fetch(`../app/controllers/api.php?action=getStudent&id=${studentId}`)
                .then(response => response.json())
                .then(data => {
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
                    } else {
                        alert('Failed to fetch student data');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error fetching student data');
                });
        });
    });
    
    // Event listeners for delete buttons
    document.querySelectorAll('.deleteRowBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            const studentName = this.getAttribute('data-name');
            
            document.getElementById('studentName').textContent = studentName;
            deleteModal.style.display = 'block';
            
            // Confirm delete
            newOkBtn.onclick = function() {
                deleteStudent(studentId);
            };
        });
    });
    
    // Delete student function
    function deleteStudent(id) {
        fetch('app/controllers/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload(); // Refresh page after successful deletion
            } else {
                alert('Failed to delete student: ' + data.message);
            }
            deleteModal.style.display = 'none';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting student');
            deleteModal.style.display = 'none';
        });
    }
    
    // Form submission (add/edit student)
    if (okBtn && studentForm) {
        okBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!studentForm.checkValidity()) {
                studentForm.reportValidity();
                return;
            }
            
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
            
            fetch('/app/controllers/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Refresh page after successful operation
                } else {
                    alert('Failed to save student: ' + data.message);
                }
                addModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving student');
                addModal.style.display = 'none';
            });
        });
    }
    
    // Select all functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
});