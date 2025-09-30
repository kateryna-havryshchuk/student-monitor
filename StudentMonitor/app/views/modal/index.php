<!-- app/modal/index.php -->
<div id="addEditModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add student</h2>
            <span class="close-btn" id="closeModalBtn">&times;</span>
        </div>
        <div class="modal-body">
            <form id="studentForm">
                <input type="hidden" id="studentId" name="id">

                <div class="form-group">
                    <label for="group">Group</label>
                    <select id="group" name="group" required>
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
                    <input type="text" id="firstName" name="firstName" required>
                </div>

                <div class="form-group">
                    <label for="lastName">Last name</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>

                <div class="form-group">
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender" required>
                        <option value="">Select Gender</option>
                        <option value="M">M</option>
                        <option value="F">F</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="birthday">Birthday</label>
                    <input type="date" id="birthday" name="birthday" required>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="submit" class="okBtn" id="okBtn">OK</button>
        </div>
    </div>
</div>
