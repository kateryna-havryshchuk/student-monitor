document.getElementById("addBtn").addEventListener("click", function() {
    document.getElementById("addModal").style.display = "block";
});

// Close modal when X is clicked
document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("addModal").style.display = "none";
});

// Close modal when Cancel button is clicked
document.getElementById("okBtn").addEventListener("click", function() {
    document.getElementById("addModal").style.display = "none";
});

// Handle chat room selection
document.querySelectorAll(".chat-item").forEach(item => {
    item.addEventListener("click", function() {
        document.querySelectorAll(".chat-item").forEach(item => {
            item.classList.remove("active");
        });
        this.classList.add("active");
        
        // Update chat room name in the header
        const chatName = this.querySelector(".chat-item-name").textContent;
        document.querySelector(".chat-title").textContent = "Chat room " + chatName;
    });
});