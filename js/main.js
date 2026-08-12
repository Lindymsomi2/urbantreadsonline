import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const shop = document.getElementById("shop");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

const cartAmount = document.getElementById("cartAmount");
const userDisplay = document.getElementById("userDisplay");
const loginLink = document.getElementById("loginLink");
const logoutButton = document.getElementById("logoutButton");

let products = [];
let currentUser = null;

// ==========================================
// AUTHENTICATION STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    userDisplay.textContent = user.email;

    loginLink.style.display = "none";
    logoutButton.style.display = "block";

    await updateCartCount();

  } else {

    userDisplay.textContent = "";

    loginLink.style.display = "block";
    logoutButton.style.display = "none";

    cartAmount.textContent = "0";
  }
});

// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener("click", async () => {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  } catch (error) {

    console.error("Logout error:", error);

    alert("Unable to log out. Please try again.");
  }
});

// ==========================================
// LOAD PRODUCTS FROM FIRESTORE
// ==========================================

async function loadProducts() {

  try {

    loadingMessage.style.display = "block";
    errorMessage.textContent = "";

    const productsSnapshot = await getDocs(
      collection(db, "Products")
    );

    products = [];

    productsSnapshot.forEach((document) => {

      products.push({
        id: document.id,
        ...document.data()
      });

    });

    loadingMessage.style.display = "none";

    if (products.length === 0) {

      shop.innerHTML = `
        <p class="empty-message">
          No products are currently available.
        </p>
      `;

      return;
    }

    displayProducts(products);

  } catch (error) {

    console.error("Cannot read/load from Firestore:", error);

    loadingMessage.style.display = "none";

    errorMessage.textContent =
      "Unable to load products. Please check your Firebase connection.";

  }
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(productsToDisplay) {

  if (productsToDisplay.length === 0) {

    shop.innerHTML = `
      <p class="empty-message">
        No products found.
      </p>
    `;

    return;
  }

  shop.innerHTML = productsToDisplay.map((product) => {

    const image =
      product.imageURL ||
      "https://via.placeholder.com/300x300?text=Urban+Threads";

    return `
      <div class="item">

        <img
          src="${image}"
          alt="${product.name || "Product"}"
          onerror="this.src='https://via.placeholder.com/300x300?text=Urban+Threads'"
        >

        <div class="details">

          <p class="category">
            ${product.category || "Streetwear"}
          </p>

          <h3>
            ${product.name || "Unnamed Product"}
          </h3>

          <p>
            ${product.description || ""}
          </p>

          <div class="price-quantity">

            <h2>
              $${Number(product.price || 0).toFixed(2)}
            </h2>

            <button
              class="add-cart-btn"
              data-product-id="${product.id}"
            >
              Add to Cart
            </button>

          </div>

        </div>

      </div>
    `;

  }).join("");

  // Add event listeners to Add to Cart buttons

  document
    .querySelectorAll(".add-cart-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const productId = button.dataset.productId;

        addToCart(productId);

      });

    });
}

// ==========================================
// ADD PRODUCT TO CART
// ==========================================

async function addToCart(productId) {

  if (!currentUser) {

    alert("Please log in before adding items to your cart.");

    window.location.href = "login.html";

    return;
  }

  try {

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {

      alert("Product could not be found.");

      return;
    }

    const cartItemRef = doc(
      db,
      "users",
      currentUser.uid,
      "cart",
      productId
    );

    const cartItemSnapshot = await getDoc(cartItemRef);

    if (cartItemSnapshot.exists()) {

      await updateDoc(cartItemRef, {
        quantity: increment(1)
      });

    } else {

      await setDoc(cartItemRef, {

        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageURL: product.imageURL || "",
        quantity: 1

      });

    }

    await updateCartCount();

    alert(`${product.name} added to your cart.`);

  } catch (error) {

    console.error("Add to cart error:", error);

    alert("Unable to add the product to your cart.");

  }
}

// ==========================================
// UPDATE CART COUNT
// ==========================================

async function updateCartCount() {

  if (!currentUser) {

    cartAmount.textContent = "0";

    return;
  }

  try {

    const cartSnapshot = await getDocs(
      collection(
        db,
        "users",
        currentUser.uid,
        "cart"
      )
    );

    let totalItems = 0;

    cartSnapshot.forEach((document) => {

      const item = document.data();

      totalItems += Number(item.quantity || 0);

    });

    cartAmount.textContent = totalItems;

  } catch (error) {

    console.error("Cart count error:", error);

    cartAmount.textContent = "0";
  }
}

// ==========================================
// CATEGORY FILTERING
// ==========================================

document
  .querySelectorAll(".filter-btn")
  .forEach((button) => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      const category = button.dataset.category;

      if (category === "All") {

        displayProducts(products);

      } else {

        const filteredProducts = products.filter(
          (product) =>
            product.category === category
        );

        displayProducts(filteredProducts);
      }

    });

  });

// ==========================================
// START
// ==========================================

loadProducts();