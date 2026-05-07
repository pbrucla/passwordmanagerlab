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
    console.log("showSignupScreen called!") // add this
    const btn = document.getElementById("signupBtn")
    console.log("button found:", btn) // add this
    btn.addEventListener("click", handleSignup)
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
    console.log("handleSignup called!")

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

    chrome.storage.local.set({
        username: username,
        password: masterPassword  // plaintext for now, crypto comes next week!
    }, () => {
        console.log("Saved to storage!")
        document.getElementById("message").textContent = "Account created!"
    })
}

async function handleLogin() {
    console.log("handleLogin called!")

    const masterPassword = document.getElementById("masterPassword").value

    if (!masterPassword) {
        document.getElementById("message").textContent = "Please enter your password"
        return
    }

    // Retrieve stored credentials
    chrome.storage.local.get(["username", "password"], (data) => {
        if (masterPassword === data.password) {
            console.log("Login successful!")
            document.getElementById("message").textContent = "Welcome back, " + data.username + "!"
        } else {
            console.log("Wrong password!")
            document.getElementById("message").textContent = "Incorrect password"
        }
    })
}