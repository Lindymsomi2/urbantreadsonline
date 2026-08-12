import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const shoppingCart =
  document.getElementById("shopping-cart");

const cartSummary =
  document.getElementById("cartSummary");

const cartLoading =
  document.getElementById("cartLoading");

const cartError =
  document.getElementById("cartError");

const cartAmount =
  document.getElementById("cartAmount");

const userDisplay =
  document.getElementById("userDisplay");

const loginLink =
  document.getElementById("loginLink");

const logoutButton =
  document.getElementById("logoutButton");

let currentUser = null;
let basket = [];

// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "login.html";

    return;
  }

  currentUser = user;

  userDisplay.textContent = user.email;

  loginLink.style.display = "none";
  logoutButton.style.display = "block";

  await loadCart();

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

  }

});

// ==========================================
// LOAD CART FROM FIRESTORE
// ==========================================

async function loadCart() {

  try {

    cartLoading.style.display = "block";

    cartError.textContent = "";

    const cartSnapshot = await getDocs(
      collection(
        db,
        "users",
        currentUser.uid,
        "cart"
      )
    );

    basket = [];

    cartSnapshot.forEach((document) => {

      basket.push({
        id: document.id,
        ...document.data()
      });

    });

    cartLoading.style.display = "none";

    displayCart();

    updateCartCount();

  } catch (error) {

    console.error("Cannot load cart:", error);

    cartLoading.style.display = "none";

    cartError.textContent =
      "Unable to load your cart. Please try again.";

  }

}

// ==========================================
// DISPLAY CART
// ==========================================

function displayCart() {

  if (basket.length === 0) {

    shoppingCart.innerHTML = "";

    cartSummary.innerHTML = "";

    shoppingCart.innerHTML = `
      <div class="empty-cart">

        <h2>Your cart is empty.</h2>

        <p>
          Add some products to your cart.
        </p>

        <a href="shop.html">
          <button class="HomeBtn">
            Continue Shopping
          </button>
        </a>

      </div>
    `;

    return;
  }

  shoppingCart.innerHTML = basket.map((item) => {

    const subtotal =
      Number(item.price) * Number(item.quantity);

    const image =
      item.imageURL ||
      "https://via.placeholder.com/150x150?text=Product";

    return `
      <div class="cart-item">

        <img
          src="${image}"
          alt="${item.name}"
          onerror="this.src='https://via.placeholder.com/150x150?text=Product'"
        >

        <div class="cart-item-details">

          <div class="title-price-x">

            <div>

              <h3>
                ${item.name}
              </h3>

              <p>
                $${Number(item.price).toFixed(2)}
              </p>

            </div>

            <button
              class="remove-btn"
              data-id="${item.id}"
            >
              <i class="bi bi-x-lg"></i>
            </button>

          </div>

          <div class="quantity-controls">

            <button
              class="quantity-btn decrease-btn"
              data-id="${item.id}"
            >
              -
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              class="quantity-btn increase-btn"
              data-id="${item.id}"
            >
              +
            </button>

          </div>

          <h3>
            Subtotal:
            $${subtotal.toFixed(2)}
          </h3>

        </div>

      </div>
    `;

  }).join("");

  createCartSummary();

  addCartButtonListeners();

}

// ==========================================
// BUTTON LISTENERS
// ==========================================

function addCartButtonListeners() {

  document
    .querySelectorAll(".increase-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        changeQuantity(
          button.dataset.id,
          1
        );

      });

    });

  document
    .querySelectorAll(".decrease-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        changeQuantity(
          button.dataset.id,
          -1
        );

      });

    });

  document
    .querySelectorAll(".remove-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        removeItem(
          button.dataset.id
        );

      });

    });

}

// ==========================================
// CHANGE QUANTITY
// ==========================================

async function changeQuantity(productId, amount) {

  const item = basket.find(
    (product) => product.id === productId
  );

  if (!item) {
    return;
  }

  const newQuantity =
    Number(item.quantity) + amount;

  if (newQuantity <= 0) {

    await removeItem(productId);

    return;
  }

  try {

    const itemRef = doc(
      db,
      "users",
      currentUser.uid,
      "cart",
      productId
    );

    await updateDoc(itemRef, {
      quantity: newQuantity
    });

    item.quantity = newQuantity;

    displayCart();

    updateCartCount();

  } catch (error) {

    console.error(
      "Unable to update quantity:",
      error
    );

    alert(
      "Unable to update the quantity."
    );

  }

}

// ==========================================
// REMOVE ITEM
// ==========================================

async function removeItem(productId) {

  try {

    const itemRef = doc(
      db,
      "users",
      currentUser.uid,
      "cart",
      productId
    );

    await deleteDoc(itemRef);

    basket = basket.filter(
      (item) => item.id !== productId
    );

    displayCart();

    updateCartCount();

  } catch (error) {

    console.error(
      "Unable to remove item:",
      error
    );

    alert(
      "Unable to remove this item."
    );

  }

}

// ==========================================
// CART SUMMARY
// ==========================================

function createCartSummary() {

  let totalItems = 0;
  let totalPrice = 0;

  basket.forEach((item) => {

    totalItems += Number(item.quantity);

    totalPrice +=
      Number(item.price) *
      Number(item.quantity);

  });

  cartSummary.innerHTML = `
    <div class="summary-box">

      <h2>Cart Summary</h2>

      <p>
        Total Items:
        <strong>${totalItems}</strong>
      </p>

      <p>
        Total:
        <strong>
          $${totalPrice.toFixed(2)}
        </strong>
      </p>

      <button
        id="checkoutButton"
        class="checkout"
      >
        Checkout
      </button>

      <button
        id="clearCartButton"
        class="removeAll"
      >
        Clear Cart
      </button>

    </div>
  `;

  document
    .getElementById("checkoutButton")
    .addEventListener("click", checkout);

  document
    .getElementById("clearCartButton")
    .addEventListener("click", clearCart);

}

// ==========================================
// CLEAR CART
// ==========================================

async function clearCart() {

  if (basket.length === 0) {
    return;
  }

  const confirmed =
    confirm(
      "Are you sure you want to clear your cart?"
    );

  if (!confirmed) {
    return;
  }

  try {

    for (const item of basket) {

      const itemRef = doc(
        db,
        "users",
        currentUser.uid,
        "cart",
        item.id
      );

      await deleteDoc(itemRef);

    }

    basket = [];

    displayCart();

    updateCartCount();

  } catch (error) {

    console.error(
      "Unable to clear cart:",
      error
    );

    alert(
      "Unable to clear your cart."
    );

  }

}

// ==========================================
// CHECKOUT
// ==========================================

function checkout() {

  if (basket.length === 0) {

    alert("Your cart is empty.");

    return;
  }

  alert(
    "Order placed successfully! Thank you for shopping with Urban Threads."
  );

}

// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {

  const totalItems =
    basket.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    );

  cartAmount.textContent = totalItems;

}