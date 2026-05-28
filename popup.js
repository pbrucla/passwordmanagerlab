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

function validateMasterPassword(password) {
    if (password.length < 8 || password.length > 20) {
        return "Password must be 8-20 characters long."
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter."
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter."
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one digit."
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one symbol (non-alphanumeric)."
    }
    return null
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

    const passwordError = false //validateMasterPassword(masterPassword)
    if (passwordError) {
        document.getElementById("message").textContent = passwordError + " Please try again."
        document.getElementById("masterPassword").value = ""
        document.getElementById("confirmPassword").value = ""
        return
    }

    document.getElementById("message").textContent = "Account created!"


    const exportedKey = generateKey(masterPassword, username)

    chrome.storage.local.set({
        username: username,
        password: exportedKey
    }, () => {
        console.log("Saved to storage!")
        document.getElementById("message").textContent = "Account created!"
    })


}

async function generateKey(masterPassword, username) {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        "raw", 
        enc.encode(masterPassword), 
        "PBKDF2", 
        false, 
        ["deriveBits", "deriveKey"]
    )

    const salt = enc.encode(username);
    const masterKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: salt,
            iterations: 100000,
        }, 
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]   
    )

    return await crypto.subtle.exportKey("jwk", masterKey)

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
        if (masterPassword === data.password.k) {
            console.log("Login successful!")
            document.getElementById("message").textContent = "Welcome back, " + data.username + "!"
        } else {
            console.log("Wrong password!")
            document.getElementById("message").textContent = "Incorrect password"
        }
    })
}