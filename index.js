document.addEventListener("DOMContentLoaded", function() {
    // Get current page URL
    const currentPage = window.location.pathname.split("/").pop();
    console.log(currentPage);
    // Get all navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Loop through the links
    navLinks.forEach(link => {
      // Get the href attribute and extract the page name
      const linkPage = link.getAttribute('href').split("/").pop();
      
      // If current page matches the link page, add active class
      if (currentPage === linkPage) {
        link.classList.add('active');
      }
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.navLinks');

    hamburger.addEventListener('click', () => {
        
        navLinks.classList.toggle('show');
    
        hamburger.classList.toggle('active');
    });

    navLinks.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            navLinks.classList.remove('show');
            hamburger.classList.remove('active');
        }
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.contains(event.target) && 
            !hamburger.contains(event.target)) {
            navLinks.classList.remove('show');
            hamburger.classList.remove('active');
        }
    });
});
