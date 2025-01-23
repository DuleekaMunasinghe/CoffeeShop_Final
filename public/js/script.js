//const { createConnection } = require("mysql");

let search = document.querySelector(".search-box");

document.querySelector("#search-icon").onclick = () => {
  search.classList.toggle("active");
  navbar.classList.remove("active");
};

// let navbar = document.querySelector('.navbar');
// document.querySelector('#menu-icon').onclick = ()=>{
//     navbar.classList.toggle('active')
//     search.classList.remove('active')
// }

window.onscroll = () => {
  navbar.classList.remove("active");
  search.classList.remove("active");
};

//shopping cart starting
//shopping cart icon
let shopping = document.querySelector(".cartTab");
document.querySelector("#cart-icon").onclick = () => {
  console.log("------->", shopping);
  shopping.classList.toggle("active");
  //navbar.classList.remove('active')
};

let cart = [];

//adding items to cart
async function addItemToCart(event) {
  console.log("------->", event);
  let productId = event.target.dataset.productId;
  const response = await fetch(`/api/products?id=${productId}`);
  if (!response.ok) {
    throw new Error("failed to fetch product information");
  }

  const product = await response.json();

  console.log("product details", product);
  let productSearchInCart = cart.find((item) => item.id === Number(productId));
  if (productSearchInCart) {
    productSearchInCart.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  //let shopping = document.querySelector('.cartTab');
  renderCart();
}

//reducing the items from the cart, , work with 'renderCart' function and the plus button
function reduceQuantity(productId) {
  let cartItem = cart.find((item) => item.id === productId); //The find method is used to search the cart array for an item whose id matches the productId passed as a parameter to the function.
  if (cartItem && cartItem.quantity > 1) {
    //this condition checks whether the cartItem exists (i.e., the item was found in the cart) and whether its quantity is greater than 1.
    cartItem.quantity -= 1; //If the item exists and its quantity is greater than 1, we reduce the quantity by 1.
    renderCart(); //we call renderCart() to update the cart's display on the page, so the user sees the updated cart with the reduced quantity.
  } else {
    // If the cartItem either doesn’t exist or its quantity is 1 (which is the minimum valid quantity for that item), this block is executed.
    // Ask the user to confirm removal of the item
    const confirmRemoval = confirm(
      //The confirm method displays a dialog box asking the user to confirm whether they want to remove the item from the cart. It shows a message with the name of the product (e.g., "The quantity for 'Item Name' is 1. Do you want to remove it from the cart?").
      `The quantity for "${cartItem.name}" is 1. Do you want to remove it from the cart?`
    );
    if (confirmRemoval) {
      //If the user confirms the removal, this block removes the item from the cart.
      // Remove the item from the cart
      cart = cart.filter((item) => item.id !== productId);
      renderCart();
      //cart.filter(...) creates a new array that contains all items except the one with the productId that the user wants to remove.
      // The filter method works by keeping only items whose id does not match the productId.
      //cart = cart.filter(...) reassigns the cart to this new filtered array, effectively removing the item from the cart.
      //After the item is removed, renderCart() is called to update the cart display again, removing the deleted item from the UI.
    }
  }
}

//increase items from the cart, work with 'renderCart' function and the plus button
function increaseQuantity(productId) {
  let cartItem = cart.find((item) => item.id === productId);
  if (cartItem) {
    cartItem.quantity += 1;
    renderCart(); // Re-render the cart to reflect the updated quantity
  }
}

function renderCart() {
  const cartContainer = document.querySelector(".listCart");
  const checkoutButton = document.querySelector(".checkout-btn");

  if (!cartContainer) {
    console.log("No cart container found. Skipping rendering.");
    return;
  }

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = `
            <div class="empty-cart-msg"> 
                <p>Your cart is empty</p>
            </div>
        `;
    checkoutButton.style.display = "none"; // Hide checkout button
    return;
  }

  checkoutButton.style.display = "block"; // Show checkout button

  cart.forEach((item) => {
    const element = document.createElement("div");
    element.classList.add("item");
    var itemPrice = Math.round(item.price * item.quantity * 100) / 100;
    element.innerHTML = `
            <div class="image">
                <img src="${item.img_url}" alt="">
            </div>
            <div class="name">${item.name}</div>
            <div class="totalPrice">$${itemPrice}</div>
            <div class="quantity">
                <span class="minus" data-product-id='${item.id}'><</span>
                <span>${item.quantity}</span>
                <span class="plus" data-product-id='${item.id}'>></span>
            </div>
        `;

    // Attach event listeners to plus and minus buttons
    const minusButton = element.querySelector(".minus");
    minusButton.addEventListener("click", (event) => {
      const productId = Number(event.target.dataset.productId);
      reduceQuantity(productId);
    });

    const plusButton = element.querySelector(".plus");
    plusButton.addEventListener("click", (event) => {
      const productId = Number(event.target.dataset.productId);
      increaseQuantity(productId);
    });

    cartContainer.appendChild(element);
  });
}

// Select the shopping cart container and close button
const closeButton = document.querySelector(".close");

// Add event listener to the close button
closeButton.addEventListener("click", () => {
  console.log("xxxxxx>", shopping);
  // Remove the 'active' class to hide the shopping cart
  shopping.classList.remove("active");
  shopping.classList.toggle("active");
});

// Select the checkout button
const checkoutButton = document.querySelector(".checkout-btn");

// Add event listener for checkout
checkoutButton.addEventListener("click", async () => {
  if (cart.length === 0) {
    //alert is a built-in function in the browser's JavaScript environment so we can use alert keyword straight way
    alert("Your cart is empty. Add some items before checking out.");
    return;
  }

  // Generate a summary of the cart
  const cartSummary = cart.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    totalPrice: item.price * item.quantity,
  }));

  console.log("Checkout summary:", cartSummary);

  // Optional: Send the cart data to a server for processing
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartSummary),
    });

    if (!response.ok) {
      throw new Error("Checkout failed. Please try again.");
    }

    const result = await response.json();
    console.log("Checkout result:", result);

    // Show success message
    alert("Checkout successful! Thank you for your purchase.");

    // Clear the cart and re-render
    cart = [];
    renderCart();
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Something went wrong during checkout. Please try again.");
  }
});

async function renderProductList() {
  const productListContainer = document.querySelector(".product-container"); //document object: manupilate document object model

  if (!productListContainer) {
    console.log("no product container found. skipping rendering the products");
    return;
  }

  try {
    const response = await fetch(`/api/products`); //should be the same in get rest api in app.js
    if (!response.ok) {
      throw Error("unable to fetch products from api");
    }

    const products = await response.json();
    console.log("products", products);
    products.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.classList.add("box");
      productElement.innerHTML = `
                <img src="${product.img_url}" alt="">
                <h3>${product.name}</h3>
                <div class="content">
                    <span>$${product.price}</span>
                    <a data-product-id='${product.id}' id="addToCart"> Add To Cart</a>
                </div>
            `;
      productListContainer.appendChild(productElement);
      const buttonElement = productElement.querySelector("#addToCart");
      buttonElement.addEventListener("click", async (event) => {
        await addItemToCart(event);
      });
    });
  } catch (error) {}
}

renderCart();
renderProductList(); //call the function / execute productlist function
