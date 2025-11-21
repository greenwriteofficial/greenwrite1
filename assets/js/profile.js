/* assets/js/profile.js
   Firebase Auth (Google + Email/Password) ONLY for profile.html
   - NO phone / OTP (so no billing required)
   - Uses modern modular Firebase SDK (CDN)
   - Saves basic profile to localStorage for order auto-fill
*/

/* ---------- Firebase imports (CDN modules) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
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

/* ---------- Init Firebase ---------- */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

const $ = (sel) => document.querySelector(sel);

/* ---------- Render UI ---------- */

function renderLoggedOut() {
  const root = $("#profileRoot");
  if (!root) return;

  root.innerHTML = `
    <h3 style="margin-top:0">Login or Sign up</h3>
    <p class="small" style="color:var(--muted)">
      Use Google or your email & password to create a simple profile.
      This is only for school project demo and order auto-fill.
    </p>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <!-- Google login -->
      <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

      <!-- Email / password login + signup -->
      <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
        <label class="small" for="emailInput">Email</label>
        <input id="emailInput" type="email" placeholder="you@example.com"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <label class="small" for="passwordInput" style="margin-top:8px;display:block">Password (min 6 characters)</label>
        <input id="passwordInput" type="password" placeholder="Enter password"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button id="btnEmailLogin" class="btn secondary" type="button">Login</button>
          <button id="btnEmailSignup" class="btn" type="button">Sign up</button>
        </div>

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
  const email = user.email || "Not set";

  root.innerHTML = `
    <h3 style="margin-top:0">Welcome, ${escapeHtml(name)}</h3>
    <p class="small" style="color:var(--muted)">
      You are logged in. We will use this info to auto-fill the order form
      on the website (in this browser only).
    </p>

    <div class="card" style="margin-top:10px;padding:10px;border-radius:10px">
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    </div>

    <p class="small" style="margin-top:8px">
      Tip: Go to the home page order form. Your name and email can be auto-filled using this profile.
    </p>

    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button id="btnFillOrder" class="btn secondary" type="button">Open Order Form</button>
      <button id="btnLogout" class="btn" type="button">Log out</button>
    </div>
  `;

  // store minimal profile in localStorage (for order form auto-fill on other pages)
  try {
    const mini = {
      name,
      email: user.email || ""
    };
    localStorage.setItem("greenwrite_profile", JSON.stringify(mini));
  } catch (e) {
    console.warn("Could not save profile locally", e);
  }

  const btnLogout = $("#btnLogout");
  const btnFillOrder = $("#btnFillOrder");

  btnLogout &&
    btnLogout.addEventListener("click", () => {
      signOut(auth).catch(console.error);
    });

  btnFillOrder &&
    btnFillOrder.addEventListener("click", () => {
      window.location.href = "index.html#order";
    });
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

/* ---------- Logged out handlers (Google + Email/Password) ---------- */
function attachLoggedOutHandlers() {
  const btnGoogle = $("#btnGoogle");
  const btnEmailLogin = $("#btnEmailLogin");
  const btnEmailSignup = $("#btnEmailSignup");
  const emailInput = $("#emailInput");
  const passwordInput = $("#passwordInput");
  const emailMsg = $("#emailMsg");

  // Google sign-in
  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error(err);
        alert("Google login failed. Check console for details.");
      }
    });
  }

  // Email/password login
  if (btnEmailLogin && emailInput && passwordInput) {
    btnEmailLogin.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass = passwordInput.value;

      if (!email || !pass) {
        emailMsg.textContent = "Enter both email and password.";
        return;
      }

      emailMsg.textContent = "Logging in...";
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        emailMsg.textContent = "";
      } catch (err) {
        console.error(err);
        if (err.code === "auth/user-not-found") {
          emailMsg.textContent = "No account found. Use Sign up.";
        } else if (err.code === "auth/wrong-password") {
          emailMsg.textContent = "Wrong password. Try again.";
        } else {
          emailMsg.textContent = "Login failed: " + (err.message || err.code);
        }
      }
    });
  }

  // Email/password signup
  if (btnEmailSignup && emailInput && passwordInput) {
    btnEmailSignup.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass = passwordInput.value;

      if (!email || !pass) {
        emailMsg.textContent = "Enter both email and password.";
        return;
      }
      if (pass.length < 6) {
        emailMsg.textContent = "Password must be at least 6 characters.";
        return;
      }

      emailMsg.textContent = "Creating account...";
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        emailMsg.textContent = "Account created! You are now logged in.";
      } catch (err) {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          emailMsg.textContent = "Email already in use. Try Login instead.";
        } else {
          emailMsg.textContent = "Sign up failed: " + (err.message || err.code);
        }
      }
    });
  }
}

/* ---------- Auth state listener ---------- */
onAuthStateChanged(auth, (user) => {
  if (user) {
    renderLoggedIn(user);
  } else {
    renderLoggedOut();
  }
});
