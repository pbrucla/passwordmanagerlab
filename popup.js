document.addEventListener("DOMContentLoaded", () => {
    // Check if account already exists
    chrome.storage.local.get("username", (data) => {
        if (data.username) {
            showLoginScreen()
        } else {
            showSignupScreen()
        }
    })
})

function showSignupScreen() {
    // show the signup form
    document.getElementById("signupBtn").addEventListener("click", handleSignup)
}

function showLoginScreen() {
    // swap the signup form for a login form
    document.body.innerHTML = `
    <h2>Welcome Back</h2>
    <input type="password" id="masterPassword" placeholder="Master Password" />
    <button id="loginBtn">Unlock</button>
    <p id="message"></p>
  `
    document.getElementById("loginBtn").addEventListener("click", handleLogin)
}

async function handleSignup() {
    const username = document.getElementById("username").value
    const masterPassword = document.getElementById("masterPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    // Basic validation
    if (!username || !masterPassword) {
        document.getElementById("message").textContent = "Please fill in all fields"
        return
    }

    if (masterPassword !== confirmPassword) {
        document.getElementById("message").textContent = "Passwords don't match"
        return
    }

    // Now you're ready for the crypto steps!
    document.getElementById("message").textContent = "Account created!"
}

async function handleLogin() {
    const masterPassword = document.getElementById("masterPassword").value
    // Login logic goes here
}