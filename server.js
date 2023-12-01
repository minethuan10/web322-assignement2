/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Vu Duc Thuan Tran Student ID: 121804223 Date: 27/9/23
*
*  Online (Cyclic) Link:  https://ill-rose-eel-tam.cyclic.app/about
*
********************************************************************************/ 



const express = require('express');
const blog_service = require('./blog-service');
const authData = require('./auth-service');
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
const clientSessions = require('client-sessions'); 
const path = require('path');
const multer = require('multer');

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer();
const app = express();

const HTTP_PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: 'ddpxildoy',
  api_key: '866879417216568',
  api_secret: 'fSSX3tQpQ_lhfKfsKMBiex2Qpv4',
  secure: true,
});

app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (context) {
      return stripJs(context);
    },
    increment: function (value) {
      return value + 1;
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
}));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', '.hbs');
app.use(express.static("static"));
app.use(express.static("public"));
app.use(express.static("views"));

app.use(
  clientSessions({
    cookieName: "session", 
    secret: "something kept hidden or unexplained", 
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60, 
  })
);


app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});


function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  app.locals.activeRoute = '/about';
  res.render('about');
});



app.get('/posts/add', ensureLogin, (req, res) => {
  blog_service.getCategories()
    .then((data) => {
      res.render('addPost', {
        categories: data,
      });
    })
    .catch(() => {
      res.render(('addPost'), { categories: [] });
    });
});



app.post('/posts/add', ensureLogin, upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };
  async function uploadFiles(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }
  uploadFiles(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;
    blog_service.addPost(req.body)
      .then(() => {
        res.redirect("/posts");
      })
      .catch((data) => {
        res.send(data);
      });
  });
});

app.get('/posts/delete/:id', ensureLogin, (req, res) => {
  blog_service.deletePostById(req.params.id)
    .then(() => {
      res.redirect('/posts');
    })
    .catch(() => {
      ('Unable to Remove Post / Post not found');
    });
});

app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory');
});


app.get('/posts', ensureLogin, (req, res) => {
  const { category, minDate } = req.query;
  if (category < 6 && category > 0) {
    blog_service.getPostsByCategory(category)
      .then((data) => {
        res.render('posts', { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else if (minDate != null) {
    blog_service.getPostsByMinDate(minDate)
      .then((data) => {
        res.render('posts', { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else {
    blog_service.getAllPosts()
      .then((data) => {
        res.render('posts', { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.get('/post/:id', ensureLogin, (req, res) => {
  blog_service.getPostById(req.params.id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.get('/blog', async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blog_service.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog_service.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = posts[0];
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blog_service.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.get('/blog/:id', async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blog_service.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog_service.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    viewData.post = await blog_service.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blog_service.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.get('/categories', ensureLogin, (req, res) => {
  blog_service.getCategories()
    .then((data) => {
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        res.render("categories", { message: "no results" });
      }
    })
    .catch(() => {
      res.render("categories", { message: "no results" });
    });
});

app.post('/categories/add', ensureLogin, (req, res) => {
  blog_service
    .addCategory(req.body)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Add category');
    });
});


app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  blog_service.deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect('/categories');
    })
    .catch(() => {
      res.status(500).send('Unable to Remove Category/Category not found');
    });
});

app.get('/login', function(req, res) {
  res.render('login');
});


app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => res.render('register', { successMessage: 'User created' }))
    .catch((err) => res.render('register', { errorMessage: err, userName: req.body.userName }));
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect('/posts');
    })
    .catch((err) => {
      console.log("error during login: " + err) ;
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});
app.get('*', (req, res) => {
  res.status(404).send("Page Not Found");
});

blog_service.initialize()
.then(authData.initialize())
  .then(() => {
    app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));
  })
  .catch(function (err) {
    console.log("Unable to open the file: " + err);
  });
