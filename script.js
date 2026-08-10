/* ==========================================================================
   FABRICA' — SITE LOGIC
   Sections:
   1. Product data
   2. Rendering the gallery
   3. Cart state + localStorage persistence
   4. Cart drawer UI (open/close, render items, qty controls)
   5. WhatsApp checkout message builder
   6. Theme (light/dark) toggle
   ========================================================================== */

/* -------------------------------------------------------------------------
   1. PRODUCT DATA
   Swap image URLs / text here to re-stock the shop — everything below
   reads from this array, nothing is hard-coded in the HTML.
   ------------------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: "booties-meadow",
    name: "Meadow Baby Booties",
    desc: "Soft cotton booties with a scalloped cuff, sized for the first year.",
    price: 24,
    img: "https://picsum.photos/seed/fabrica-booties/600/600"
  },
  {
    id: "bracelet-terracotta",
    name: "Terracotta Charm Bracelet",
    desc: "Hand-knotted cotton cord bracelet with a single brass charm.",
    price: 18,
    img: "https://picsum.photos/seed/fabrica-bracelet/600/600"
  },
  {
    id: "tote-sundried",
    name: "Sundried Tote Handbag",
    desc: "A roomy market tote worked in double-strand cotton for structure.",
    price: 68,
    img: "https://picsum.photos/seed/fabrica-tote/600/600"
  },
  {
    id: "cushion-olive-grove",
    name: "Olive Grove Cushion Cover",
    desc: "18-inch cushion cover in a textured shell stitch, cotton back panel.",
    price: 32,
    img: "https://picsum.photos/seed/fabrica-cushion/600/600"
  },
  {
    id: "hanger-honeycomb",
    name: "Honeycomb Plant Hanger",
    desc: "Single-tier macrame-style hanger, holds pots up to 8 inches wide.",
    price: 22,
    img: "https://picsum.photos/seed/fabrica-hanger/600/600"
  },
  {
    id: "runner-coastal",
    name: "Coastal Table Runner",
    desc: "A long open-lace runner in undyed cotton, 14 by 72 inches.",
    price: 45,
    img: "https://picsum.photos/seed/fabrica-runner/600/600"
  },
  {
    id: "scrunchies-golden-hour",
    name: "Golden Hour Scrunchie Set",
    desc: "Set of three ribbed scrunchies in warm, sun-worn tones.",
    price: 14,
    img: "https://picsum.photos/seed/fabrica-scrunchie/600/600"
  },
  {
    id: "basket-harvest",
    name: "Harvest Market Basket",
    desc: "Sturdy rope-base basket with woven handles, great for produce.",
    price: 54,
    img: "https://picsum.photos/seed/fabrica-basket/600/600"
  }
];

const WHATSAPP_NUMBER = "1234567890"; // TODO: replace with the real shop number, digits only.
const CART_STORAGE_KEY = "fabrica_cart_v1";
const THEME_STORAGE_KEY = "fabrica_theme";

const money = (n) => `$${n.toFixed(2)}`;

/* -------------------------------------------------------------------------
   2. RENDER GALLERY
   ------------------------------------------------------------------------- */
const grid = document.getElementById("product-grid");

function renderProducts() {
  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="product-card">
      <div class="product-media">
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="600" height="600">
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="product-price">${money(p.price)}</span>
          <button type="button" class="add-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join("");
}
renderProducts();

/* -------------------------------------------------------------------------
   3. CART STATE
   Cart is an object keyed by product id: { [id]: quantity }
   Saved to localStorage on every change so it survives a page refresh.
   ------------------------------------------------------------------------- */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Could not read saved cart, starting fresh.", err);
    return {};
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

let cart = loadCart();

function cartLineItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }))
    .filter((line) => line.product && line.qty > 0);
}

function cartCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function cartTotal() {
  return cartLineItems().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  renderCart();
}

function setQty(id, qty) {
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  saveCart();
  renderCart();
}

function clearCart() {
  cart = {};
  saveCart();
  renderCart();
}

/* -------------------------------------------------------------------------
   4. CART DRAWER UI
   ------------------------------------------------------------------------- */
const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("drawer-overlay");
const cartToggleBtn = document.getElementById("cart-toggle");
const cartCloseBtn = document.getElementById("cart-close");
const cartCountEl = document.getElementById("cart-count");
const cartItemsEl = document.getElementById("cart-items");
const cartEmptyEl = document.getElementById("cart-empty");
const cartTotalEl = document.getElementById("cart-total");
const whatsappBtn = document.getElementById("whatsapp-checkout");
const clearBtn = document.getElementById("cart-clear");

function openCart() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  cartToggleBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-locked");
  cartCloseBtn.focus();
}

function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  cartToggleBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-locked");
  cartToggleBtn.focus();
}

function renderCart() {
  const lines = cartLineItems();
  const count = cartCount();
  const total = cartTotal();

  // Header badge
  cartCountEl.textContent = count;
  cartCountEl.classList.remove("bump");
  void cartCountEl.offsetWidth; // restart the bump animation
  cartCountEl.classList.add("bump");
  cartToggleBtn.setAttribute("aria-label", `Open cart, ${count} item${count === 1 ? "" : "s"}`);

  // Empty state vs list
  cartEmptyEl.style.display = lines.length ? "none" : "block";
  cartItemsEl.innerHTML = lines.map((line) => `
    <li class="cart-item">
      <img src="${line.product.img}" alt="" width="58" height="58">
      <div>
        <p class="cart-item-name">${line.product.name}</p>
        <p class="cart-item-price">${money(line.product.price)} &times; ${line.qty}</p>
        <div class="cart-item-qty">
          <button type="button" class="qty-btn" data-action="dec" data-id="${line.product.id}" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-val">${line.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${line.product.id}" aria-label="Increase quantity">&plus;</button>
        </div>
      </div>
      <button type="button" class="cart-item-remove" data-action="remove" data-id="${line.product.id}">Remove</button>
    </li>
  `).join("");

  cartTotalEl.textContent = money(total);
  whatsappBtn.disabled = lines.length === 0;
}

cartToggleBtn.addEventListener("click", openCart);
cartCloseBtn.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("open")) closeCart();
});

// Add-to-cart buttons (event delegation, since cards are rendered dynamically)
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  addToCart(btn.dataset.id, 1);

  // Micro-interaction: button briefly confirms the add
  const original = btn.textContent;
  btn.textContent = "Added!";
  btn.classList.add("added");
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("added");
    btn.disabled = false;
  }, 1100);
});

// Quantity +/- and remove, inside the cart drawer
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const current = cart[id] || 0;

  if (action === "inc") setQty(id, current + 1);
  if (action === "dec") setQty(id, current - 1);
  if (action === "remove") setQty(id, 0);
});

clearBtn.addEventListener("click", clearCart);

/* -------------------------------------------------------------------------
   5. WHATSAPP CHECKOUT
   Builds a plain-text order summary and opens wa.me with it URL-encoded.
   ------------------------------------------------------------------------- */
function buildWhatsAppMessage() {
  const lines = cartLineItems();
  const itemLines = lines
    .map((line) => `- ${line.product.name} x${line.qty} — ${money(line.product.price * line.qty)}`)
    .join("\n");

  return [
    "Hello Fabrica', I would like to place an order.",
    "",
    itemLines,
    "",
    `Grand total: ${money(cartTotal())}`
  ].join("\n");
}

whatsappBtn.addEventListener("click", () => {
  if (!cartLineItems().length) return;
  const text = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener");
});

/* -------------------------------------------------------------------------
   6. THEME TOGGLE (light / dark, default warm-earthy light)
   ------------------------------------------------------------------------- */
const themeToggleBtn = document.getElementById("theme-toggle");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggleBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  themeToggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (savedTheme) applyTheme(savedTheme);

themeToggleBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
});

/* -------------------------------------------------------------------------
   INIT
   ------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
renderCart();
