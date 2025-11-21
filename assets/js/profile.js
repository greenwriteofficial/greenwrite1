/* assets/js/profile.js
   Firebase Auth (Google + Phone) ONLY for profile.html

   - On real Firebase setup: uses real Google + Phone (SMS OTP)
   - If phone auth / billing is NOT enabled:
       -> automatic DEMO OTP mode (code shown on screen, no SMS)
   - Stores minimal profile in localStorage for order auto-fill
*/

/* ---------- Only run on profile.html ---------- */
const isProfilePage = window.location.pathname.endsWith("profile.html");
if (!isProfilePage) {
  console.log("profile.js: not profile.html, skipping auth UI");
}

/* ---------- Firebase imports (modular via CDN) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  signInAnonymously
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

const $ = (sel) => document.querySelector(sel);

/* ========= DEMO / FALLBACK FLAGS ========= */
let recaptchaVerifier = null;
let confirmationResult = null;
let useDemoOtp = false;      // true when phone auth is not enabled / billing issue
let demoOtpCode = null;      // generated demo OTP
let lastPhoneNumber = "";    // phone entered by user

/* ========= RENDER UI ========= */

function renderLoggedOut() {
  const root = $("#profileRoot");
  if (!root) return;
  root.innerHTML = `
    <h3 style="margin-top:0">Login or Sign up</h3>
    <p class="small" style="color:var(--muted)">
      Use Google or your phone number to create a simple profile. This is only for demo and order auto-fill.
    </p>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

      <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
        <label class="small" for="phoneInput">Login with phone (with country code)</label>
        <input id="phoneInput" type="tel" placeholder="+91 98765 43210"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />
        <button id="btnSendOtp" class="btn secondary" type="button" style="margin-top:6px">Send OTP</button>

        <div id="otpArea" style="display:none;margin-top:8px">
          <label class="small" for="otpInput">Enter OTP</label>
          <input id="otpInput" type="text" placeholder="123456"
                 style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />
          <button id="btnVerifyOtp" class="btn" type="button" style="margin-top:6px">Verify & Login</button>
        </div>
        <div id="phoneMsg" class="small" style="margin-top:6px;color:var(--muted)"></div>
      </div>
    </div>

    <div id="recaptcha-container" style="margin-top:10px"></div>
  `;

  attachLoggedOutHandlers();
}

function renderLoggedIn(user) {
  const root = $("#profileRoot");
  if (!root) return;

  // read any saved profile (for phone/override)
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem("greenwrite_profile") || "null");
  } catch (e) {}

  const name =
    user.displayName ||
    (stored && stored.name) ||
    "GreenWrite user";
  const email =
    user.email ||
    (stored && stored.email) ||
    "Not set";
  const phone =
    user.phoneNumber ||
    (stored && stored.phone) ||
    "Not set";

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

  // merge & save minimal profile in localStorage
  try {
    const mini = {
      name,
      email: email === "Not set" ? "" : email,
      phone: phone === "Not set" ? "" : phone
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

/* ---------- Escape helper ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s])
  );
}

/* ---------- reCAPTCHA setup ---------- */
function setupRecaptcha() {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      console.log("reCAPTCHA solved");
    }
  });
  return recaptchaVerifier;
}

/* ---------- Handlers when logged out ---------- */
function attachLoggedOutHandlers() {
  const btnGoogle = $("#btnGoogle");
  const btnSendOtp = $("#btnSendOtp");
  const btnVerifyOtp = $("#btnVerifyOtp");
  const phoneInput = $("#phoneInput");
  const otpArea = $("#otpArea");
  const otpInput = $("#otpInput");
  const phoneMsg = $("#phoneMsg");

  // Google Login
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

  // Send OTP (SMS or DEMO)
  if (btnSendOtp && phoneInput) {
    btnSendOtp.addEventListener("click", async () => {
      const phone = phoneInput.value.trim();
      lastPhoneNumber = phone;
      if (!phone) {
        phoneMsg.textContent = "Enter phone number with country code (e.g., +91 ...).";
        return;
      }
      phoneMsg.textContent = "Sending OTP...";
      useDemoOtp = false;
      demoOtpCode = null;

      try {
        const verifier = setupRecaptcha();
        confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
        otpArea.style.display = "block";
        phoneMsg.textContent = "OTP sent. Please check your phone.";
      } catch (err) {
        console.error(err);

        // If billing/phone auth not enabled, use DEMO OTP instead
        const msg = String(err.message || "");
        const code = err.code || "";

        if (
          code === "auth/billing-not-enabled" ||
          code === "auth/operation-not-allowed" ||
          msg.toLowerCase().includes("phone auth is not enabled") ||
          msg.toLowerCase().includes("must enable billing")
        ) {
          useDemoOtp = true;
          demoOtpCode = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
          otpArea.style.display = "block";
          phoneMsg.innerHTML =
            "Phone auth / billing is not enabled on this Firebase project, " +
            "so we are using <strong>DEMO OTP mode</strong> for your school project.<br>" +
            `Demo OTP: <strong>${demoOtpCode}</strong> (enter this to login)`;
        } else {
          phoneMsg.textContent = "Failed to send OTP. Check number and try again.";
        }
      }
    });
  }

  // Verify OTP
  if (btnVerifyOtp && otpInput) {
    btnVerifyOtp.addEventListener("click", async () => {
      const code = otpInput.value.trim();
      if (!code) return;

      // DEMO MODE
      if (useDemoOtp) {
        if (code !== demoOtpCode) {
          phoneMsg.textContent = "Invalid demo OTP. Check and try again.";
          return;
        }
        phoneMsg.textContent = "OTP verified (demo). Logging you in...";
        try {
          // Anonymous sign-in to have a Firebase user (no billing needed)
          await signInAnonymously(auth);
          // Save phone in localStorage profile
          try {
            const current = JSON.parse(localStorage.getItem("greenwrite_profile") || "null") || {};
            current.phone = lastPhoneNumber;
            if (!current.name) current.name = "GreenWrite user";
            if (!current.email) current.email = "";
            localStorage.setItem("greenwrite_profile", JSON.stringify(current));
          } catch (e) {
            console.warn("Could not save demo phone profile", e);
          }
        } catch (err) {
          console.error(err);
          phoneMsg.textContent = "Demo login failed. Please try again.";
        }
        return;
      }

      // REAL SMS MODE
      if (!confirmationResult) {
        phoneMsg.textContent = "Please request OTP again.";
        return;
      }
      try {
        phoneMsg.textContent = "Verifying...";
        await confirmationResult.confirm(code);
        phoneMsg.textContent = "Phone verified!";
      } catch (err) {
        console.error(err);
        phoneMsg.textContent = "Invalid OTP. Please try again.";
      }
    });
  }
}

/* ---------- Auth state listener ---------- */
if (isProfilePage) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderLoggedIn(user);
    } else {
      renderLoggedOut();
    }
  });
}
