//LOGIN PAGE(INDEX.HTML)

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

//Validation
function validate(){
    let username= document.getElementById("name1").value
    let pwd=document.getElementById("pwd").value
    let email1=document.getElementById("email1").value

    //username should consist atleast 6-10 characters

    if(username.length <6 || username.length >=10)
    {
        alert("username should consist atleast 6-10 characters");
        event.preventDefault();
        return;
    }

    let emailpattern = /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]{2,6}$/

    if(!emailpattern.test(email1)){
        alert("Email must contain @ and .");
        event.preventDefault();
        return;
    }

     let pwdpattern = /^[A-Za-z][A-Za-z0-9!#@%]{6,}$/

    if(!pwdpattern.test(pwd)){
        alert("password must start with letters,alphanumerics,special characters and should contain atleast 6 characters");
        event.preventDefault();
        return;
    }
    alert("successfull login");
    window.location.href="home.html"

}
//validation for signIn
function valid2(){
    let pwds=document.getElementById("pwd2").value
    let email=document.getElementById("email2").value
    
    let emailpattern = /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]{2,6}$/

    if(!emailpattern.test(email)){
        alert("Email must contain @ and .");
        event.preventDefault();
        return;
    }

     let pwdpattern = /^[A-Za-z][A-Za-z0-9!#@%]{6,}$/

    if(!pwdpattern.test(pwds)){
        alert("password must start with letters,alphanumerics,special characters and should contain atleast 6 characters");
        event.preventDefault();
        return;
    }
    alert("successfull login");
    window.location.href="home.html"

}




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



/* products*/
// script.js

const search = document.getElementById("search");
const category = document.getElementById("categoryFilter");
const lowStock = document.getElementById("lowStock");

function filterProducts() {

let rows = document.querySelectorAll("#productTable tr");

rows.forEach(row => {

let name = row.cells[0].innerText.toLowerCase();
let cat = row.dataset.category;
let stock = parseInt(row.dataset.stock);

let searchValue = search.value.toLowerCase();
let categoryValue = category.value;

let show = true;

// Search filter
if(!name.includes(searchValue)){
show = false;
}

// Category filter
if(categoryValue !== "all" && cat !== categoryValue){
show = false;
}

// Low stock filter
if(lowStock.checked && stock > 15){
show = false;
}

row.style.display = show ? "" : "none";

});

}

search.addEventListener("keyup", filterProducts);
category.addEventListener("change", filterProducts);
lowStock.addEventListener("change", filterProducts);
