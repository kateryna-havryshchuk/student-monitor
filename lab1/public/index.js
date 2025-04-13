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
    
     // Modal elements
     const loginBtn = document.getElementById('loginBtn');
     const loginModal = document.getElementById('loginModal');
     const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
     const loginSubmitBtn = document.getElementById('loginSubmitBtn');
     const loginForm = document.getElementById('loginForm');
 
     // Open login modal when login button is clicked
     if (loginBtn) {
         loginBtn.addEventListener('click', () => {
             loginModal.style.display = 'block';
         });
     }
 
     // Close login modal when close button is clicked
     if (closeLoginModalBtn) {
         closeLoginModalBtn.addEventListener('click', () => {
             loginModal.style.display = 'none';
         });
     }
 
     // Close modal when clicking outside
     window.addEventListener('click', (event) => {
         if (event.target === loginModal) {
             loginModal.style.display = 'none';
         }
     });
 
     // Handle login submission
     if (loginSubmitBtn && loginForm) {
         loginSubmitBtn.addEventListener('click', (e) => {
             e.preventDefault();
             
             // Basic validation
             const email = document.getElementById('email').value.trim();
             const password = document.getElementById('password').value;
             
             if (!email || !password) {
                 showErrorMessage('Please fill in both fields.');
                 return;
             }
             
             // Show loading state
             loginSubmitBtn.textContent = 'Loading...';
             loginSubmitBtn.disabled = true;
             
             // Submit the form directly
             submitLoginForm(email, password);
         });
     }
     
     // Function to show error messages
     function showErrorMessage(message) {
         // Find or create error element
         let errorElement = document.getElementById('loginErrorMessage');
         if (!errorElement) {
             errorElement = document.createElement('p'); 
             errorElement.id = 'loginErrorMessage';
             errorElement.style.color = 'red';
             errorElement.style.marginBottom = '10px';
             
             const modalBody = document.querySelector('#loginModal .modal-body');
             modalBody.insertBefore(errorElement, modalBody.firstChild);
         }
         
         errorElement.textContent = message;
     }
     
     // Function to submit the login form using a traditional POST
     function submitLoginForm(email, password) {
         // Create a temporary form for submission
         const tempForm = document.createElement('form');
         tempForm.method = 'POST';
         tempForm.action = '/lab1';
         tempForm.style.display = 'none';
         
         // Add email field
         const emailField = document.createElement('input');
         emailField.type = 'email';
         emailField.name = 'email';
         emailField.value = email;
         tempForm.appendChild(emailField);
         
         // Add password field
         const passwordField = document.createElement('input');
         passwordField.type = 'password';
         passwordField.name = 'password';
         passwordField.value = password;
         tempForm.appendChild(passwordField);
         
         // Add form to body and submit
         document.body.appendChild(tempForm);
         tempForm.submit();
     }
     
     // Check for login messages on page load (from session)
     function checkForLoginMessages() {
         // You would need to pass these from PHP to JS
         // This is placeholder code assuming you have a way to pass session messages to JS
         const loginError = getSessionMessage('login_error');
         const loginSuccess = getSessionMessage('login_success');
         
         if (loginError) {
             showErrorMessage(loginError);
             // Optional: open the modal to show the error
             loginModal.style.display = 'block';
         }
         
         if (loginSuccess) {
          
         }
     }
     
     // Placeholder function - you need to implement this based on your setup
     function getSessionMessage(key) {
         // This would need to be implemented based on how you pass session messages to JS
         // For example, you might use data attributes or a global JS variable set by PHP
         return null;
     }
     
     // Check for messages on page load
     checkForLoginMessages();




    
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
            newOkBtn.replaceWith(newOkBtn.cloneNode(true));
            const freshNewOkBtn = document.getElementById('newOkBtn');
            freshNewOkBtn.addEventListener('click', function() {
                deleteStudent(studentId);
            });
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
