//var express = require("express");
//var app = express();
const express = require('express');
const app = express();
var path = require("path");
var bcrypt = require("bcrypt");
var conn = require("./db");
var session = require("express-session");
const { ifError } = require("assert");
const { error } = require("console");
const url = require("url");
const dotenv = require('dotenv')
const Guid = require("guid");
const { parse } = require('querystring');



app.use(
  // the session we are using
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //


//Data logic
const calculateShippingCharge = function(itemCount, shippingRate){
  if(itemCount>=20){ 
    
    return 0;
  }
  let calculatedCharge = 0;
  let pieces = (itemCount/4) +1;
  calculatedCharge = pieces *shippingRate;
  return calculatedCharge;

}

const calculateTax= function(subtotal, taxRate){
  return subtotal* taxRate;
}

const calculateGrandTotal= function(subtotal, shippingCharges, tax){
  return subtotal+shippingCharges+tax;
}


// Serve static files from the "public" directory
app.use("/public", express.static(__dirname + "/public"));

// Route for the home page
app.get("/", function (req, res) {
  res.render("home"); // Render the "home.ejs" view
});

// Route for the login page
app.get("/login", function (req, res) {
  res.render("login"); // Make sure you have a login.ejs file in your views directory
});

app.get("/register", function (req, res) {
  res.render("register"); // Render register.ejs
});

// Route for the About Us page
app.get("/aboutus", function (req, res) {
  res.render("aboutus"); // Render the "aboutus.ejs" view
});

// Route for the products page
app.get("/products", function (req, res) {
  res.render("products"); // Ensure you have a products.ejs file
});

// Route for the logged_products page
app.get("/logged_products", function (req, res) {
  res.render("logged_products"); // Ensure you have a products.ejs file
});

// Route for the logged_products page
app.get("/adminpannel", function (req, res) {
  res.render("adminpannel"); // Ensure you have a products.ejs file
});

app.get("/mystore", function (req, res) {
  const sql = "SELECT * FROM products"; // Select everything from the products table
  conn.query(sql, function (err, results) {
    if (err) {
      console.error("Database query error:", err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log(results); // Log the results to the console
      res.render("mystore", { data: results }); // Now the results from the DB are sent to the view
    }
  });
});

// app.get("/editproduct/:id", function(req, res){
//   res.render("editproduct");
// })

// Routes product page
app.get("/rating", function (req, res) {
  if (!req.session.loggedIn) {
    //if the user is not login this will direct to login page and then the user can login first to rate the products
    res.redirect("/login");
    res.end();
  } else {
    res.render("rating");
  }
});

// Route for the customers page
app.get("/customers", function (req, res) {
  res.render("customers"); // Render register.ejs
});

// Route for the checkout page
app.get("/checkout", function (req, res) {
  res.render("checkout"); // Ensure you have a products.ejs file
});

// // Route for the payment page
// app.get("/payment", function (req, res) {
//   res.render("payment"); // Ensure you have a products.ejs file
// });

// Route for the Thank you page
app.get("/thankyou", function (req, res) {
  res.render("thankyou"); // Ensure you have a products.ejs file
});

// Route for the admin-messages page
app.get("/messages", function (req, res) {
  res.render("messages"); // Ensure you have a products.ejs file
});

// Registration Process
app.post("/reg", function (request, response) {
  console.log("Register Request", request.body);

  if (request.body.password !== request.body.confirmPassword) {
    console.log("Password not match");

    // Show the alert checking the password and confirmed password are matching or not, we have used alert in a script as app.js runs in a Node.js (server-side) environment.
    response.send(
      `<script>alert("Oops! Your passwords don't match. Please try entering them again."); window.location.href = "/register"; </script>`
    );
    //response.redirect("/register");
    response.end();
  } else {
    console.log("Password match");

    // Hash the password

    var hashedPassword = bcrypt.hashSync(request.body.password, 10);
    console.log("Hashed Password", hashedPassword);

    // ADD TO DATABASE

    conn.query(
      "INSERT INTO users (first_name, last_name, address, email,  password) VALUES (?, ?, ?, ?, ?)",
      [
        request.body.firstName,
        request.body.lastName,
        request.body.address,
        request.body.email,
        hashedPassword,
      ],
      function (error, results, fields) {
        if (error) throw error;
        console.log("User added to database");
        //These alert are not working and give an error message saying need to put it before we send the data to database, but don't know how to do it
        // // Show the alert checking the password and confirmed password are matching or not, we have used alert in a script as app.js runs in a Node.js (server-side) environment.
        // response.send(
        //   `<script>alert("You're all registered! Just click 'OK' to log in and get started.); window.location.href = "/login"; </script>`
        // );
        // alert("Your cart is empty. Add some items before checking out.");
        // return;
        response.send(
          `<script>alert("You're all registered! Just click 'OK' to log in and get started."); window.location.href = "/login"; </script>`
        );
        // response.redirect("/login");
      }
    );
  }
});

// Login Process
app.post("/auth", function (request, response) {
  console.log("Login Request", request.body);

  conn.query(
    "SELECT * FROM users WHERE email = ?",
    [request.body.email],
    function (error, results, fields) {
      if (error) throw error;
      console.log("User found in database", results);

      if (results.length > 0) {
        var user = results[0];
        console.log("User", user);
        var passwordMatch = bcrypt.compareSync(
          request.body.password,
          user.password
        );
        console.log("Password Match", passwordMatch);

        if (passwordMatch) {
          request.session.email = request.body.email;
          request.session.loggedIn = true;
          if (user.is_admin == 1) {
            response.redirect("/adminpannel"); // if the login success --> redirect to product page
          } else {
            // Show the alert checking the user is an admin or not, we have used alert in a script as app.js runs in a Node.js (server-side) environment.
            response.send(
              `<script>alert("You are not an admin. You will be directed to your favorite products"); window.location.href = "/logged_products"; </script>`
            );

            //request.session.successMessage = "Sorry.";
            //response.redirect("/");
            response.end();
          }
        } else {
          response.send(
            `<script>alert("Invalid Username Or Password! Please Try Again!!"); window.location.href = "/login"; </script>`); // if the login failed --> redirect to login page
          response.end();
        }
      } else {
        response.send("User not found");
      }
    }
  );
});

// Route admin dashboard
app.get("/adminpannel", function (req, res) {
  //in order to make the admin accessible to admin pages, we need to go database and manupilate the value of "is_admin" 0 to 1, then admin can access the dashboard
  if (!req.session.loggedIn) {
    res.redirect("/login");
    res.end();
  } else {
    // Check if the user is an admin
    // Get the user from the database
    conn.query(
      "SELECT * FROM users WHERE email = ?",
      [req.session.email],

      function (error, results, fields) {
        if (error) throw error;
        console.log("User found in database", results);

        if (results.length > 0) {
          var user = results[0];
          console.log("User", user);
          if (user.is_admin == 1) {
            // checking the user is admin, only admin can access the dashboard
            console.log("User is admin");

            // Fetch all the ratings from the database

            conn.query(
              "SELECT * FROM ratings",
              function (error, results, fields) {
                if (error) throw error;
                console.log("Ratings From database", results);

                // Create a histogram of the ratings

                var histogram = {
                  1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                  2: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                  3: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                };

                for (var i = 0; i < results.length; i++) {
                  var rating = results[i];
                  histogram[rating.product_id][rating.rating]++;
                }

                console.log("Histogram", histogram);

                res.render("adminpannel", { ratings: results });
              }
            );
          } else {
            console.log("User is not admin");
            res.redirect("/rating");
            res.end();
          }
        } else {
          console.log("User not found");
          res.redirect("/");
          res.end();
        }
      }
    );
  }
});

// Process rating submission
app.post("/submit_ratings", function (req, res) {
  if (!req.session.loggedIn) {
    //if the user is not login this will direct to login page and then the user can login first to rate the products
    res.redirect("/login");
    res.end();
  }

  console.log("Rating Submission", req.body);

  // Who rated the product
  console.log("User", req.session.username);

  // TODO: check if the user has already rated the product
  // If the user has already rated the product, update the rating

  // Process the rating submission

  var ratings = [
    {
      product_id: 1,
      rating: req.body.rating_product1,
    },
    {
      product_id: 2,
      rating: req.body.rating_product2,
    },
    {
      product_id: 3,
      rating: req.body.rating_product3,
    },
  ];
  console.log("Ratings", ratings);
  // Add to database

  for (var i = 0; i < ratings.length; i++) {
    conn.query(
      "INSERT INTO ratings (product_id, rating, user) VALUES (?, ?, ?)",
      [ratings[i].product_id, ratings[i].rating, req.session.email],
      function (error, results, fields) {
        if (error) throw error;
        console.log("Rating added to database");
      }
    );
  }
});

// shipping Process (IMPORTANT)
app.post("/payment", function (request, response) {
  //creating guid for identify the user
  const guid = Guid.create().value;
  console.log("New GUID: ", guid);
  session.guid = guid;

  const { name, phone_number, street_address, suburb, city, post_code } =
    request.body; //getting info from th checkout form / THIS DATA SHOULD TAKEN FROM THE HTML CODE, NOT FROM THE DB, ALWAYS THE NAME
  const sql =
    "INSERT INTO shipping (name, phone_number, street_address, suburb, city, postal_code, guid) VALUES (?, ?, ?, ?, ?, ?, ?)"; //inserting the info to shipping DB
  conn.query(
    sql,
    [name, phone_number, street_address, suburb, city, post_code, guid],
    (Error, results) => {
      //now we got data instead of the names themselves for variabls here in the squre blackts
      if (Error) throw Error; //this will print the error in the terminal
      response.redirect("/payment");
    }
  );
});

// FEEDBACK Process (IMPORTANT)
// app.post("/feedback", function (request, response) {
//   const { email, textarea } = request.body;
//   const sql = "INSERT INTO feedback (email, comment) VALUES (?, ?)";
//   conn.query(sql, [email, textarea], (Error, results) => {
//     if (Error) throw Error;
//     response.redirect("/thankyou");
//   });
// });

// FEEDBACK Process (IMPORTANT) - 2nd attempt
app.post("/feedbacks", function (request, response) {
  // Destructure the form data from the request body
  const { name, email, feedback, rating, feedback_type, subscribe } =
    request.body;

  // SQL query to insert feedback data into the 'feedbacks' table
  const sql = `
    INSERT INTO feedbacks (name, email, feedback, rating, feedback_type, subscribe)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Execute the query with the data from the request body
  conn.query(
    sql,
    [name, email, feedback, rating, feedback_type, subscribe],
    (error, results) => {
      if (error) {
        console.error(error); // Log any error that occurs
        response
          .status(500)
          .send("An error occurred while submitting feedback.");
      } else {
        console.log("Comments added to database");
        response.redirect("/thankyou"); // Redirect the user to the "thank you" page
      }
    }
  );
});

//showing feedback messages in admin panel
// Route for the admin messages page
app.get("/admin", function (req, res) {
  // Fetch all the feedbacks data
  conn.query("SELECT * FROM feedbacks", function (error, results, fields) {
    if (error) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).send("Error fetching feedbacks");
      return;
    }

    // Log the results for debugging
    console.log("Message From database", results);

    // Pass feedbacks to the 'admin' view (assuming 'admin' is a template name)
    res.render("admin", { feedbacksData: results });
  });
});

//showing shipping details in payment page
// // Route for the payment page
// app.get("/payment", function (req, res) {
//   // Fetch all the shipping data
//   conn.query("SELECT * FROM shipping", function (error, results, fields) {
//     if (error) {
//       console.error("Error fetching shipping:", error);
//       res.status(500).send("Error fetching shipping");
//       return;
//     }

//     // Log the results for debugging
//     console.log("Message From database", results);

//     // Pass data to the 'payment' view
//     res.render("payment", { shippingData: results });
//   });
// });

app.get("/payment", function (req, res) {
  // Pass data to the 'payment' view

  console.log("PAYMENT SESSION: ", session);

  //const cartSummary = req;
  //const subtotal = cartSummary.reduce((total, item) => total + item.totalPrice, 0);
  //console.log("Subtotal of the cart:", subtotal);  // Log subtotal for debugging
  // req.session.subtotal=subtotal;

  const subtotal = req.session.subtotal; 

  const query = "SELECT * FROM shipping WHERE guid = ?";
  conn.query(query, [session.guid], function (err, results) {
    // Handle any database errors
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to retrieve shipping item",
      });
    }

    // If no product found
    if (results.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: `Shipping with ID ${session.guid} not found`,
      });
    }
    console.log("Shipping item: ", results[0]); 
    Math.round
    session.guid = null;
    res.render("payment", {
       data: results[0],
       subtotal: Math.round(subtotal* 100) / 100,
       tax:Math.round(req.session.tax* 100) / 100, 
       grandTotal:Math.round(req.session.grandTotal* 100) / 100, 
       shippingCharges:Math.round(req.session.shippingCharges* 100) / 100});
  });
});

//getting data from database to admin mystore page\
// app.get("/mystore",function(req, res){

//   const query = "SELECT * FROM products"
//   conn.query(queryAll, function (err, results){
//     // if (err) {
//     //   console.error("Database error:", err);
//     //   return res.status(500).json({
//     //     error: "Internal server error",
//     //     message: "Failed to retrieve products",
//     //   });
//     // }
//     if(err) throw err
//     res.render("mystore", { results});
//   });
// });


// Route for logout
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
  res.end();
  console.log("User logged out");
});

// REST API functions
app.get("/api/products", function (req, res) {
  //api for product search
  const productId = req.query.id; // Change from req.params.id to req.query.id

  // If no product ID is provided, fetch all products
  if (!productId) {
    const queryAll = "SELECT * FROM products";
    conn.query(queryAll, function (err, results) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to retrieve products",
        });
      }

      // Return all products
      return res.status(200).json(results);
    });
  } else {
    // If product ID is provided, search for specific product
    const query = "SELECT * FROM products WHERE id = ?";
    conn.query(query, [productId], function (err, results) {
      // Handle any database errors
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to retrieve product",
        });
      }

      // If no product found
      if (results.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: `Product with ID ${productId} not found`,
        });
      }

      // Return the first (and should be only) matching product
      res.status(200).json(results[0]);
    });
  }
});


app.use(express.json());  // This is necessary for parsing JSON body

app.post('/api/checkout', async (req, res) => {
    const cartSummary = req.body;
    console.log("Received cart for checkout:", cartSummary); // Make sure cart data is received correctly


    // Calculate subtotal
    let subtotal =await cartSummary.reduce((total, item) => {
      if (typeof item.totalPrice !== 'number') {
          console.error("Invalid item totalPrice:", item.totalPrice);
          return total; // Skip invalid items
      }
      return total + item.totalPrice;}, 0);

      let totalQuantity =await cartSummary.reduce((total, item) => {
        if (typeof item.quantity !== 'number') {
            console.error("Invalid item totalPrice:", item.quantity);
            return total; // Skip invalid items
        }
        return total + item.quantity;}, 0);

    // Log subtotal for debugging
    req.session.subtotal=subtotal;
    // subtotal = req.session.subtotal;
    let shippingRate = 1.0; 
    let shippingCharges = calculateShippingCharge(totalQuantity,shippingRate); // declaring shippingCharges variable
    req.session.shippingCharges = shippingCharges; //assign shippingCharges variable to the current session
    let taxRate =0.15; //getting tax rate from environment
    let tax = calculateTax(subtotal, taxRate); // declaring tax variable
    req.session.tax = tax;// passing tax value to session
    let grandTotal= calculateGrandTotal(subtotal, shippingCharges, tax); // passing grand total to session
    req.session.grandTotal = grandTotal;// passing grandTotal value to session

    console.log("Shipping:", req.session.shippingCharges);
    res.json({ message: 'Checkout successful'});
});


// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Node app is running on port ${PORT}`);
});
