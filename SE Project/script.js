//LOGIN PAGE(INDEX.HTML)
document.getElementById("login").addEventListener("submit", function(event) {

    event.preventDefault(); // stop form from submitting
  
    let admin = document.getElementById("admin").value;
    let password = document.getElementById("password").value;
  
    // Username: length > 6 and < 10
    if (admin.length <= 6 || admin.length >= 10) {
        alert("Username must be more than 6 and less than 10 characters");
        return;
    }
  
    // Password: start with letter, alphanumeric, >6 characters
    let passwordPattern = /^[A-Za-z][A-Za-z0-9]{6,}$/;
  
    if (!passwordPattern.test(password)) {
        alert("Password must start with a letter, be alphanumeric, and more than 6 characters");
        return;
    }

  
    // Redirect after successful validation
    window.location.href = "home.html";
  });

// HOME PAGE - Menu Button Toggle
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

if (menuBtn) {
    menuBtn.addEventListener('click', function() {
        dropdownMenu.classList.toggle('show');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (dropdownMenu && !event.target.closest('.menu-container')) {
        dropdownMenu.classList.remove('show');
    }
});

// Handle dropdown item clicks
const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', function(event) {
        event.preventDefault();
        const text = this.textContent;
        console.log('Selected: ' + text);
        // Add your navigation or action logic here
        dropdownMenu.classList.remove('show');
    });
});

