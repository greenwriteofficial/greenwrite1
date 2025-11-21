// assets/js/profile.js
// Firebase Auth for Profile page: Google + Phone OTP

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// === Your Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J"
};

// === Init Firebase ===
let app, auth, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "en";
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.error("Firebase init error:", e);
  alert("Firebase failed to initialize. Check console for details.");
}

// === Helper ===
const $ = (id) => document.getElementById(id);

const googleBtn = $("googleBtn");
const phoneInput = $("phoneInput");
const sendOtpBtn = $("sendOtpBtn");
const otpBox = $("otpBox");
const otpInput = $("otpInput");
const verifyOtpBtn = $("verifyOtpBtn");
const loginBox = $("loginBox");
const userBox = $("userBox");
const logoutBtn = $("logoutBtn");
const statusEl = $("authStatus");
const errorEl = $("authError");
const uName = $("uName");
const uEmail = $("uEmail");
const uPhone = $("uPhone");
const uUid = $("uUid");

let recaptchaVerifier = null;
let confirmationResult = null;

// ===== Status & error helpers =====
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
  console.log("[AUTH STATUS]", msg);
}

function setError(msg) {
  if (!errorEl) return;
  if (!msg) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  } else {
    errorEl.style.display = "block";
    errorEl.textContent = msg;
    console.error("[AUTH ERROR]", msg);
  }
}

// ===== reCAPTCHA for phone auth =====
function setupRecaptcha() {
  if (!auth) return null;
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      console.log("reCAPTCHA solved.");
    }
  });
  return recaptchaVerifier;
}

// ===== GOOGLE SIGN-IN =====
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    if (!auth || !googleProvider) {
      alert("Firebase is not ready. Check your Firebase config.");
      return;
    }
    setError("");
    setStatus("Opening Google sign-in...");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setStatus(`Signed in as ${user.displayName || user.email || "user"}`);
    } catch (err) {
      console.error("Google sign-in error:", err);
      // Common useful messages:
      // auth/operation-not-allowed → Enable Google provider in Firebase
      // auth/unauthorized-domain → Add your domain to Authorized domains
      setStatus("Google sign-in failed.");
      setError(err.code + " — " + (err.message || "Google sign-in error."));
      alert("Google sign-in error: " + err.code);
    }
  });
}

// ===== PHONE OTP FLOW =====
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async () => {
    if (!auth) {
      alert("Firebase is not ready. Check your Firebase config.");
      return;
    }
    setError("");
    const phoneNumber = (phoneInput && phoneInput.value.trim()) || "";
    if (!phoneNumber) {
      setError("Please enter your phone number with country code (e.g. +91...).");
      return;
    }
    setStatus("Sending OTP...");
    try {
      const verifier = setupRecaptcha();
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setStatus("OTP sent! Please check your phone.");
      if (otpBox) otpBox.style.display = "block";
    } catch (err) {
      console.error("Send OTP error:", err);
      setStatus("Failed to send OTP.");
      setError(err.code + " — " + (err.message || "Could not send OTP."));
      alert("Send OTP error: " + err.code);
    }
  });
}

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", async () => {
    if (!auth) {
      alert("Firebase is not ready. Check your Firebase config.");
      return;
    }
    setError("");
    if (!confirmationResult) {
      setError("Please request OTP first.");
      return;
    }
    const code = (otpInput && otpInput.value.trim()) || "";
    if (!code) {
      setError("Please enter the OTP.");
      return;
    }
    setStatus("Verifying OTP...");
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      setStatus(`Signed in with phone: ${user.phoneNumber || "success"}`);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setStatus("Failed to verify OTP.");
      setError(err.code + " — " + (err.message || "Invalid OTP."));
      alert("Verify OTP error: " + err.code);
    }
  });
}

// ===== LOGOUT =====
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (!auth) {
      alert("Firebase is not ready. Check your Firebase config.");
      return;
    }
    setError("");
    setStatus("Logging out...");
    try {
      await signOut(auth);
      setStatus("Logged out.");
    } catch (err) {
      console.error("Logout error:", err);
      setStatus("Logout failed.");
      setError(err.code + " — " + (err.message || "Could not logout."));
      alert("Logout error: " + err.code);
    }
  });
}

// ===== AUTH STATE LISTENER =====
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginBox) loginBox.style.display = "none";
      if (userBox) userBox.style.display = "block";

      if (uName) uName.textContent = user.displayName || "(no name)";
      if (uEmail) uEmail.textContent = user.email || "-";
      if (uPhone) uPhone.textContent = user.phoneNumber || "-";
      if (uUid) uUid.textContent = user.uid;

      setStatus("You are logged in.");
      setError("");
    } else {
      if (loginBox) loginBox.style.display = "flex";
      if (userBox) userBox.style.display = "none";

      setStatus("Not logged in.");
      setError("");
    }
  });
} else {
  setStatus("Firebase not initialized.");
}
