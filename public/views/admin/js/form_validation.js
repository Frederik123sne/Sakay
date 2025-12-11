document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("addForm");
  const editForm = document.getElementById("editForm");

  // Email validation regex
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate form fields
  function validateForm(formType) {
    let isValid = true;

    const fname = document.getElementById(`${formType}_fname`);
    const lname = document.getElementById(`${formType}_lname`);
    const email = document.getElementById(`${formType}_email`);
    const role = document.getElementById(`${formType}_roles`);

    const errorFname = document.getElementById(`error_${formType}_fname`);
    const errorLname = document.getElementById(`error_${formType}_lname`);
    const errorEmail = document.getElementById(`error_${formType}_email`);
    const errorRole = document.getElementById(`error_${formType}_role`);

    // Reset previous errors
    errorFname.textContent = "";
    errorLname.textContent = "";
    errorEmail.textContent = "";
    errorRole.textContent = "";

    // First Name
    if (fname.value.trim() === "") {
      errorFname.textContent = "First name is required.";
      isValid = false;
    }

    // Last Name
    if (lname.value.trim() === "") {
      errorLname.textContent = "Last name is required.";
      isValid = false;
    }

    // Email
    if (email.value.trim() === "") {
      errorEmail.textContent = "Email is required.";
      isValid = false;
    } else if (!isValidEmail(email.value.trim())) {
      errorEmail.textContent = "Enter a valid email.";
      isValid = false;
    }

    // Role
    if (role.value === "") {
      errorRole.textContent = "Please select a role.";
      isValid = false;
    }

    return isValid;
  }

  // Handle Add Form
  addForm.addEventListener("submit", (e) => {
    e.preventDefault(); // stop browser validation
    if (validateForm("add")) {
      addForm.submit(); // submit manually if valid
    }
  });

  // Handle Edit Form
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateForm("edit")) {
      editForm.submit();
    }
  });
});
