// Get elements - will be null if they don't exist
const header = document.getElementById("header");
const backToTopBtn = document.getElementById("backToTop");

const images = [
  'url("views/assets/SAMCIS Campus/banner1.jpg")',
  'url("views/assets/SAMCIS Campus/banner4.jpg")',
  'url("views/assets/SAMCIS Campus/banner5.jpg")',
  'url("views/assets/SAMCIS Campus/banner6.jpg")',
  'url("views/assets/SAMCIS Campus/banner2.jpg")',
  'url("views/assets/SAMCIS Campus/banner3.jpg")',
  'url("views/assets/SAMCIS Campus/banner7.jpg")',
  'url("views/assets/SAMCIS Campus/banner8.jpg")',
  'url("views/assets/SAMCIS Campus/banner9.jpg")',
];

let index = 0;

function changeHeaderBackground() {
  // Double-check header exists before accessing style
  if (header && header.style) {
    header.style.backgroundImage = images[index];
    index = (index + 1) % images.length; // loop

    // Save current index
    sessionStorage.setItem("slideshowIndex", index);
  }
}

// Only run slideshow if header exists
if (header) {
  try {
    // Start immediately
    changeHeaderBackground();

    // Change every 5 seconds
    setInterval(changeHeaderBackground, 5000);
  } catch (error) {
    console.error("Slideshow error:", error);
  }
}

// Up Button - Only if the button exists on the page
if (backToTopBtn) {
  try {
    // Show button when user scrolls down 200px
    window.onscroll = function () {
      if (backToTopBtn && backToTopBtn.style) {
        if (
          document.body.scrollTop > 200 ||
          document.documentElement.scrollTop > 200
        ) {
          backToTopBtn.style.display = "block";
        } else {
          backToTopBtn.style.display = "none";
        }
      }
    };

    // Scroll to top smoothly
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } catch (error) {
    console.error("Back to top button error:", error);
  }
} else {
  // If button doesn't exist, create an empty scroll handler to prevent errors
  window.onscroll = function () {
    // Do nothing - button doesn't exist
  };
}
