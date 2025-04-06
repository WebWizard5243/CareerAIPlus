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
const assessmentForm = document.getElementById('career-assessment-form');
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const skills = document.getElementById('skillsInput').value.split(',').map(s => s.trim());
            const interests = document.getElementById('interestsInput').value.split(',').map(i => i.trim());
            const aspirations = document.getElementById('aspirationsInput').value;
            
            try {
                const response = await fetch('/api/assessment/nlp-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: getUserId(), // You need to implement this function
                        skills,
                        interests,
                        aspirations
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    window.location.reload(); // Reload to show recommendations
                } else {
                    alert('Error submitting assessment. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error submitting assessment. Please try again.');
            }
        });
    }
    
    // Helper function to get user ID from session/cookie
    function getUserId() {
        // Implement based on your authentication strategy
        // For example, you might have a hidden input in the form with the user ID
        const userIdEl = document.getElementById('userId');
        return userIdEl ? userIdEl.value : null;
    }

   const formData = new FormData();
formData.append("resume", fileInput.files[0]);

fetch("/ResumeReview", {
  method: "POST",
  body: formData,
});
