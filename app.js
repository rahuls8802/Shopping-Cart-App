const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const config = require("./config/database");
const session = require("express-session");
const expressValidator = require("express-validator");
const fileUpload = require("express-fileupload");
// const passport = require('passport');

// Connect to db
mongoose.connect(config.database);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Init app
const app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Set public folder
app.use(express.static(path.join(__dirname, "public")));

// Set global errors constiable
app.locals.errors = null;

// Get Page Model
const Page = require("./models/page");

// Get all pages to pass to header.ejs
Page.find({})
  .sort({ sorting: 1 })
  .exec(function (err, pages) {
    if (err) {
      console.log(err);
    } else {
      app.locals.pages = pages;
    }
  });

// Get Category Model
const Category = require("./models/category");

// Get all categories to pass to header.ejs
Category.find(function (err, categories) {
  if (err) {
    console.log(err);
  } else {
    app.locals.categories = categories;
  }
});

// Express fileUpload middleware
app.use(fileUpload());

// Body Parser middleware
//
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

// Express Session middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    //  cookie: { secure: true }
  })
);

// Express Validator middleware
app.use(
  expressValidator({
    errorFormatter: function (param, msg, value) {
      const namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value,
      };
    },
    customValidators: {
      isImage: function (value, filename) {
        const extension = path.extname(filename).toLowerCase();
        switch (extension) {
          case ".jpg":
            return ".jpg";
          case ".jpeg":
            return ".jpeg";
          case ".png":
            return ".png";
          case "":
            return ".jpg";
          default:
            return false;
        }
      },
    },
  })
);

// Express Messages middleware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Passport Config
// require('./config/passport')(passport);
// Passport Middleware
// app.use(passport.initialize());
// app.use(passport.session());

app.get("*", function (req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});

// Set routes
const pages = require("./routes/pages");
const products = require("./routes/products");
// const cart = require('./routes/cart');
// const users = require('./routes/users');
const adminPages = require("./routes/admin_pages");
const adminCategories = require("./routes/admin_categories");
const adminProducts = require("./routes/admin_products");

app.use("/admin/pages", adminPages);
app.use("/admin/categories", adminCategories);
app.use("/admin/products", adminProducts);
app.use("/products", products);
// app.use('/cart', cart);
// app.use('/users', users);
app.use("/", pages);

// Start the server
const port = 3000;
app.listen(port, function () {
  console.log("Server started on port " + port);
});
