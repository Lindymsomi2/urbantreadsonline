import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

const authError = document.getElementById("auth-error");
const authSuccess = document.getElementById("auth-success");
const authErrorLogin = document.getElementById("auth-error-login");
const authSuccessLogin = document.getElementById("auth-success-login");

const navUserGreeting =
  document.getElementById("nav-user-greeting");

const navAuth =
  document.getElementById("nav-auth");

const navLogout =
  document.getElementById("nav-logout");

// Auth link handlers
const authLinks = document.querySelectorAll('.auth-link');
authLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  });
});





// ==========================================
// CLEAR MESSAGES
// ==========================================

function clearMessages() {
  if (authError) {
    authError.textContent = "";
    authError.classList.add("hidden");
  }
  if (authSuccess) {
    authSuccess.textContent = "";
    authSuccess.classList.add("hidden");
  }
  if (authErrorLogin) {
    authErrorLogin.textContent = "";
    authErrorLogin.classList.add("hidden");
  }
  if (authSuccessLogin) {
    authSuccessLogin.textContent = "";
    authSuccessLogin.classList.add("hidden");
  }
}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(message, formType = 'signup') {
  const errorElement = formType === 'login' ? authErrorLogin : authError;
  const successElement = formType === 'login' ? authSuccessLogin : authSuccess;
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }
  if (successElement) {
    successElement.classList.add("hidden");
  }
}


// ==========================================
// SHOW SUCCESS
// ==========================================

function showSuccess(message, formType = 'signup') {
  const successElement = formType === 'login' ? authSuccessLogin : authSuccess;
  const errorElement = formType === 'login' ? authErrorLogin : authError;
  
  if (successElement) {
    successElement.textContent = message;
    successElement.classList.remove("hidden");
  }
  if (errorElement) {
    errorElement.classList.add("hidden");
  }
}


// ==========================================
// SIGN UP
// ==========================================

signupForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  clearMessages();

  const email =
    document.getElementById("signup-email").value.trim();

  const password =
    document.getElementById("signup-password").value;

  const confirmPassword =
    document.getElementById("signup-confirm").value;


  // Validate email

  if (!email) {

    showError("Please enter your email address.", 'signup');

    return;
  }


  // Validate password

  if (password.length < 6) {

    showError(
      "Password must be at least 6 characters.",
      'signup'
    );

    return;
  }


  // Check passwords

  if (password !== confirmPassword) {

    showError(
      "Passwords do not match.",
      'signup'
    );

    return;
  }


  try {

    // Create Firebase Authentication account

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    // Create user document in Firestore

    await setDoc(
      doc(db, "users", user.uid),
      {
        email: email,
        createdAt: new Date()
      }
    );


    console.log(
      "User created:",
      user.uid
    );


    showSuccess(
      "Account created successfully! Redirecting...",
      'signup'
    );


    // Give the user a moment to see the message

    setTimeout(() => {

      window.location.href = "shop.html";

    }, 1000);


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    showError(
      getAuthErrorMessage(error),
      'signup'
    );

  }

});


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  clearMessages();


  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;


  if (!email) {

    showError(
      "Please enter your email address.",
      'login'
    );

    return;
  }


  if (!password) {

    showError(
      "Please enter your password.",
      'login'
    );

    return;
  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    showSuccess(
      "Login successful! Redirecting...",
      'login'
    );


    setTimeout(() => {

      window.location.href = "shop.html";

    }, 700);


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    showError(
      getAuthErrorMessage(error),
      'login'
    );

  }

});


// ==========================================
// LOGOUT
// ==========================================

if (navLogout) {

  navLogout.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        console.log(
          "User logged out."
        );

        window.location.href = "index.html";

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    }
  );

}


// ==========================================
// AUTH ERROR MESSAGES
// ==========================================

function getAuthErrorMessage(error) {

  switch (error.code) {

    case "auth/invalid-email":
      return "Please enter a valid email address.";


    case "auth/user-not-found":
      return "No account was found with this email.";


    case "auth/wrong-password":
      return "Incorrect email or password.";


    case "auth/invalid-credential":
      return "Incorrect email or password.";


    case "auth/email-already-in-use":
      return "An account already exists with this email.";


    case "auth/weak-password":
      return "Password must be at least 6 characters.";


    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";


    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";


    default:
      return "Something went wrong. Please try again.";

  }

}


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    console.log(
      "Currently logged in:",
      user.email
    );


    // Show user's name/email in navbar

    if (navUserGreeting) {

      let displayName = user.email;


      try {

        const userDoc =
          await getDoc(
            doc(db, "users", user.uid)
          );


        if (userDoc.exists()) {

          const userData =
            userDoc.data();


          if (userData.email) {

            displayName =
              userData.email;

          }

        }

      } catch (error) {

        console.error(
          "Could not load user information:",
          error
        );

      }


      navUserGreeting.textContent =
        `Hi, ${displayName}`;

      navUserGreeting.classList.remove(
        "hidden"
      );

    }


    // Hide Login / Sign Up

    if (navAuth) {

      navAuth.classList.add("hidden");

    }


    // Show Logout

    if (navLogout) {

      navLogout.classList.remove("hidden");

    }


  } else {

    console.log(
      "No user is currently logged in."
    );


    // Hide user greeting

    if (navUserGreeting) {

      navUserGreeting.classList.add(
        "hidden"
      );

    }


    // Show Login / Sign Up

    if (navAuth) {

      navAuth.classList.remove("hidden");

    }


    // Hide Logout

    if (navLogout) {

      navLogout.classList.add("hidden");

    }

  }

});