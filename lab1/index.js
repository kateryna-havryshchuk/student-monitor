
// Add modal functionality for adding students
document.getElementById('addBtn').onclick = function() {
    // Show modal
    showModal('Add student', null);
}

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

// Function to create modal
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'studentModal';
    modal.classList.add('modal');
    
    modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add student</h2>
            <span class="close-btn">&times;</span>
        </div>
        <div class="modal-body">
            <form id="studentForm">
                <div class="form-group">
                    <label for="group">Group</label>
                    <select id="group" name="group">
                        <option value="">Select Group</option>
                        <option value="PZ-21">PZ-21</option>
                        <option value="PZ-22">PZ-22</option>
                        <option value="PZ-23">PZ-23</option>
                        <option value="PZ-24">PZ-24</option>
                        <option value="PZ-25">PZ-25</option>
                        <option value="PZ-26">PZ-26</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="firstName">First name</label>
                    <input type="text" id="firstName" name="firstName">
                </div>
                <div class="form-group">
                    <label for="lastName">Last name</label>
                    <input type="text" id="lastName" name="lastName">
                </div>
                <div class="form-group">
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender">
                        <option value="">Select Gender</option>
                        <option value="M">M</option>
                        <option value="F">F</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="birthday">Birthday</label>
                    <input type="date" id="birthday" name="birthday">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button id="okBtn">OK</button>
            <button id="createBtn">Create</button>
        </div>
    </div>
`;


    document.body.appendChild(modal);
    
    // Close button functionality
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = function() {
        closeModal();
     };
    
    // Fix the closeModal function to properly reference the modal
    function closeModal() {
        modal.style.display = 'none';
    }


    // Fix the okBtn functionality
    const okBtn = document.getElementById('okBtn');
    okBtn.onclick = function() {
        const group = document.getElementById('group').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const gender = document.getElementById('gender').value;
        const birthday = document.getElementById('birthday').value;
        
        // Check if ALL fields are filled
        if (group && firstName && lastName && gender && birthday) {
            // All fields are filled, so save the data
            const formattedDate = formatDate(birthday);
            addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);
            
            // Reset the form after successful submission
            document.getElementById('studentForm').reset();

            closeModal();
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
    
     // Simple validation - check if fields are filled
    if (!group || !firstName || !lastName || !gender || !birthday) {
        alert('Please fill in all fields');
        return;
    }
    
    // Format date for display (assuming input is YYYY-MM-DD)
    const formattedDate = formatDate(birthday);
    
    // Create and add new row
    addNewRow(group, firstName + ' ' + lastName, gender, formattedDate);

    // Reset the form after successful submission
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

