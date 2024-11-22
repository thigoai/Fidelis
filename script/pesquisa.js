
const searchLink = document.getElementById('search-link');
const searchBar = document.getElementById('search-bar'); 


searchLink.addEventListener('click', function(event) {
    event.preventDefault(); 
    
    
    if (searchBar.style.display === 'none' || searchBar.style.display === '') {
        searchBar.style.display = 'block'; 
    } else {
        searchBar.style.display = 'none'; 
    }
});

const profilePicture = document.getElementById('profilePicture');
const dropdownMenu = document.getElementById('dropdownMenu');


