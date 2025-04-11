// This script handles moderator login for BH or 59 rooms.
// It checks the password and redirects to the correct room panel.

document.getElementById("modLoginBtn").addEventListener("click", () => {
  const password = document.getElementById("modPassword").value.trim();

  const roomPasswords = {
    bhmod: "bhpanel.html",
    "59mod": "59panel.html",
  };

  const redirectPage = roomPasswords[password.toLowerCase()];
  if (redirectPage) {
    window.location.href = redirectPage;
  } else {
    alert("Incorrect moderator password.");
  }
});
