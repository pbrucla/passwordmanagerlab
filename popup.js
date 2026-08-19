let globalMasterKey = "";
const verifierPlaintext = "success";

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

function showHomeScreen() {
    document.body.innerHTML = `
    <input type="text" id="accountName" placeholder="Site Name" />
    <input type="text" id="username" placeholder="Site Username" />
    <input type="password" id="password" placeholder="Site Password" />
    <button id="addCredBtn">Save Credentials</button>
    <p id="message"></p> `
    document.getElementById("addCredBtn").addEventListener("click", addCredentials)
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

    const salt = new Uint8Array(16)
    crypto.getRandomValues(salt)
    const saltedMasterKey = await generateKey(masterPassword, salt)

    //globalMasterKey = saltedMasterKey;

    const {verifierEncrypted, verifierIV} = await encryptVerifier(saltedMasterKey)

    chrome.storage.local.set({
        username: username,
        verifierEncrypted: verifierEncrypted,
        verifierIV: verifierIV,
        salt: Array.from(salt)
    }, () => {
        console.log("Saved to storage!")
        document.getElementById("message").textContent = "Account created!"
    })


}

async function generateKey(masterPassword, salt) {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        "raw", 
        enc.encode(masterPassword), 
        "PBKDF2", 
        false, 
        ["deriveBits", "deriveKey"]
    )
    
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

async function encryptVerifier(masterKey){
    const enc = new TextEncoder()
    
    const verifierEncoded = enc.encode(verifierPlaintext)
    const verifierIV = crypto.getRandomValues(new Uint8Array(12));
    const verifierEncrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: verifierIV}, masterKey, verifierEncoded)

    return {
        verifierEncrypted: verifierEncrypted,
        verifierIV: verifierIV,
    }
}

async function handleLogin() {
    console.log("handleLogin called!")

    const masterPassword = document.getElementById("masterPassword").value

    if (!masterPassword) {
        document.getElementById("message").textContent = "Please enter your password"
        return
    }

    // Retrieve stored credentials
    chrome.storage.local.get(["username", "verifierEncrypted", "verifierIV", "salt"], async (data) => {
        const passwordAttempt = await generateKey(masterPassword, data.salt)
        const {verifierEncrypted, verifierIV} = await encryptVerifier(passwordAttempt)

        if (passwordAttempt.k === data.password.k) {
            console.log("Login successful!")
            document.getElementById("message").textContent = "Welcome back, " + data.username + "!"
            showHomeScreen()
            globalMasterKey = passwordAttempt
        } else {
            console.log("Wrong password!")
            document.getElementById("message").textContent = "Incorrect password"
        }
    })
}

async function addCredentials() {
    const accountName = document.getElementById("accountName").value
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    if (!accountName || !username || !password) {
        document.getElementById("message").textContent = "Please fill in all fields"
        return
    }

    chrome.storage.local.get("vault", async (data) => {
        const existing = data.vault || []

        // encrypt password and username
        const {username: encryptedUsername, usernameIV, password: encryptedPassword, passwordIV} = await encryptCredentials(username, password)

        const newCredentials = { site: accountName, username: encryptedUsername, usernameIV, password: encryptedPassword, passwordIV }
        existing.push(newCredentials)

        chrome.storage.local.set({ vault: existing }, () => {
            document.getElementById("message").textContent = "Credentials saved!"
            document.getElementById("accountName").value = ""
            document.getElementById("username").value = ""
            document.getElementById("password").value = ""
        })
    })
}

async function encryptCredentials(accountUsername, accountPassword) {
    const enc = new TextEncoder()
    
    const usernameEncoded = enc.encode(accountUsername)
    const usernameIV = crypto.getRandomValues(new Uint8Array(12));
    const usernameEncrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: usernameIV}, globalMasterKey, usernameEncoded) // fix this

    const passwordEncoded = enc.encode(accountPassword)
    const passwordIV = crypto.getRandomValues(new Uint8Array(12));
    const passwordEncrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: passwordIV }, globalMasterKey, passwordEncoded)

    return {
        username: usernameEncrypted,
        usernameIV: usernameIV,
        password: passwordEncrypted,
        passwordIV: passwordIV,
    } // return as JSON, figure this out
}