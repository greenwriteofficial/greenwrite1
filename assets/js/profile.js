/* assets/js/profile.js
   Firebase Auth (Google + Email/Password) ONLY for profile.html
   - Uses modular Firebase SDK
   - No phone/OTP, no reCAPTCHA
*/

const isProfilePage = window.location.pathname.endsWith("profile.html");

/* ---------- Firebase imports (modular) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- Your Firebase config ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

if (isProfilePage) {
  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s]));
  }

  function renderLoggedOut() {
    const root = $("#profileRoot");
    if (!root) return;
    root.innerHTML = `
      <h3 style="margin-top:0">Login or Sign up</h3>
      <p class="small" style="color:var(--muted)">
        Use Google or your email & password to create a simple profile.
        This is only for demo and order auto-fill.
      </p>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
        <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

        <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
          <label class="small" for="emailInput">Email</label>
          <input id="emailInput" type="email" placeholder="you@example.com"
                 style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

          <label class="small" for="passwordInput" style="margin-top:8px">Password (min 6 chars)</label>
          <input id="passwordInput" type="password" placeholder="******"
                 style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

          <button id="btnEmailAuth" class="btn secondary" type="button" style="margin-top:8px">
            Login / Sign up with Email
          </button>

          <div id="emailMsg" class="small" style="margin-top:6px;color:var(--muted)"></div>
        </div>
      </div>
    `;

    attachLoggedOutHandlers();
  }

  function renderLoggedIn(user) {
    const root = $("#profileRoot");
    if (!root) return;
    const name = user.displayName || "GreenWrite user";
    const phone = user.phoneNumber || "Not set";
    const email = user.email || "Not set";

    root.innerHTML = `
      <h3 style="margin-top:0">Welcome, ${escapeHtml(name)}</h3>
      <p class="small" style="color:var(--muted)">
        You are logged in. We will use this info to auto-fill the order form on the website (in this browser only).
      </p>

      <div class="card" style="margin-top:10px;padding:10px;border-radius:10px">
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      </div>

      <p class="small" style="margin-top:8px">
        Tip: Go to the home page order form. Your name, phone and email can be auto-filled using this profile.
      </p>

      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button id="btnFillOrder" class="btn secondary" type="button">Open Order Form</button>
        <button id="btnLogout" class="btn" type="button">Log out</button>
      </div>
    `;

    // Store minimal profile in localStorage (for order form auto-fill)
    try {
      const mini = {
        name,
        email: user.email || "",
        phone: user.phoneNumber || ""
      };
      localStorage.setItem("greenwrite_profile", JSON.stringify(mini));
    } catch (e) {
      console.warn("Could not save profile locally", e);
    }

    const btnLogout = $("#btnLogout");
    const btnFillOrder = $("#btnFillOrder");

    btnLogout && btnLogout.addEventListener("click", () => signOut(auth).catch(console.error));
    btnFillOrder &&
      btnFillOrder.addEventListener("click", () => {
        window.location.href = "index.html#order";
      });
  }

  function attachLoggedOutHandlers() {
    const btnGoogle   = $("#btnGoogle");
    const btnEmail    = $("#btnEmailAuth");
    const emailInput  = $("#emailInput");
    const passwordInp = $("#passwordInput");
    const emailMsg    = $("#emailMsg");

    if (btnGoogle) {
      btnGoogle.addEventListener("click", async () => {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } catch (err) {
          console.error(err);
          alert("Google login failed. (Check console for details.)");
        }
      });
    }

    if (btnEmail && emailInput && passwordInp) {
      btnEmail.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const pass  = passwordInp.value.trim();
        if (!email || !pass) {
          emailMsg.textContent = "Enter both email and password.";
          return;
        }
        emailMsg.textContent = "Checking account...";
        try {
          await signInWithEmailAndPassword(auth, email, pass);
          emailMsg.textContent = "Logged in!";
        } catch (err) {
          if (err.code === "auth/user-not-found") {
            if (confirm("No account found. Create a new account with this email?")) {
              try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                const displayName = prompt("Enter your name (optional):");
                if (displayName) {
                  await updateProfile(cred.user, { displayName });
                }
                emailMsg.textContent = "Account created & logged in!";
              } catch (e2) {
                console.error(e2);
                emailMsg.textContent = e2.message || "Could not create account.";
              }
            } else {
              emailMsg.textContent = "Signup cancelled.";
            
            }
          } else {
            console.error(err);
            emailMsg.textContent = err.message || "Login failed.";
          }
        }
      });
    }
  }

  /* ---------- Auth state listener ---------- */
  onAuthStateChanged(auth, (user) => {
    if (!isProfilePage) return;
    if (user) renderLoggedIn(user);
    else renderLoggedOut();
  });
}
