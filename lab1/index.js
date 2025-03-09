// Add new row
document.getElementById('addBtn').onclick = function(){
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <th><input type="checkbox"></th>
        <td>SA-21</td>
        <td>Tom Ellis</td>
        <td>M</td>
        <td>31.03.2004</td>
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

    const newDeleteButton = newRow.querySelector('.deleteRowBtn');
    addDeleteListener(newDeleteButton);
    $('#studentsTable').paging('refresh');

}

// Delete row
let deleteButtons = document.querySelectorAll('.deleteRowBtn');
deleteButtons.forEach(button => addDeleteListener(button));

function addDeleteListener(button) {
    button.addEventListener('click', function() {
        const row = button.closest('tr');
        row.remove();
        $('#studentsTable').paging('refresh');
    });
}

$(document).ready(function(){
    $('#studentsTable').paging({limit: 7});
})