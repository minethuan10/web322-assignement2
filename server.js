
const express = require('express'); 
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
const app = express(); 
const path = require('path');
const blog_service = require('./blog-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer();
const HTTP_PORT = process.env.PORT || 8080; 

cloudinary.config({
  cloud_name: 'dwnhc9gwu',
  api_key: '393935347294981',
  api_secret: 'S0SclRPOmJvnc3T7bjSYoloDQRg',
  secure: true
});

app.engine('.hbs', exphbs.engine({
  extname:'.hbs', 
  helpers: {
      navLink: function(url, options) {
          return '<li' + 
              ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
              '><a href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function(lvalue, rvalue, options) {
          if (arguments.length < 3)
              throw new Error("Handlebars Helper equal needs 2 parameters");
          if (lvalue != rvalue) {
              return options.inverse(this);
          } else {
              return options.fn(this);
          }
      },
      safeHTML: function(context){
          return stripJs(context);
      } , 
      increment: function(value){
        return value + 1;
      }
      
  }}));
  

app.use('/', express.static(path.join('public')));

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// exphbs.handlebars.registerHelper('navLink', function(url, options) {
//   return '<li' + 
//     ((url === app.locals.activeRoute) ? ' class="active" ' : '') + 
//     '><a href="' + url + '">' + options.fn(this) + '</a></li>';
// });

// exphbs.handlebars.registerHelper('increment', function(value) {
//   return value + 1;
// });

// exphbs.handlebars.registerHelper('safeHTML', function(context) {
//   return stripJs(context);
// });

// exphbs.handlebars.registerHelper('equal', (lvalue, rvalue, options) => {
//   if (arguments.length < 3)
//       throw new Error("Handlebars Helper equal needs 2 parameters");
//   if (lvalue != rvalue) {
//       return options.inverse(this);
//   } else {
//       return options.fn(this);
//   }
// });

app.set('view engine', '.hbs');

app.get('/', (req, res) => 
{
  res.redirect('/about');
});

app.get('/about', (req, res) => 
{
  app.locals.activeRoute = '/about';
  res.render('about');
});

app.get('/posts/add', (req, res) => 
{ 
  res.render('addPost');
});

app.get('/blog', async (req, res) => {

  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blog_service.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blog_service.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blog_service.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});

app.get('/posts', (req, res) =>
 {
  
  const {category, minDate} = req.query;
  
 if (category)
  {
    blog_service
    .getPostsByCategory(parseInt(category))
    .then((data) => {
      res.render('posts', {posts: data});
    })
    .catch((err) => {
      res.render("posts", {message: "no results"});
    });
  }

  else if (minDate)
  {
    blog_service
    .getPostsByMinDate(minDate)
    .then((data) => {
      res.render('posts', {posts: data});
    })
    .catch((err) => {
      res.render("posts", {message: "no results"});
    })
  }
   else
 {
  blog_service
    .getAllPosts()
    .then((data) => {
      res.render('posts', {posts: data});
    })
    .catch((err) => {
      res.render("posts", {message: "no results"});
    });
  }
});


app.get('/post/:id', (req, res) => 
{
  blog_service
  .getPostById(parseInt(req.params.id))
  .then((data) => {
    res.json(data);
  })
  .catch((err) =>
  {
    res.json(err)
  })
})

app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blog_service.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blog_service.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blog_service.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blog_service.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

app.get('/categories', (req, res) => 
{
  blog_service
    .getCategories()
    .then((data) => {
      res.render("categories", {categories: data});
    })
    .catch((err) => {
      res.render("categories", {message: "no results"});
    });
});
app.get("*", (req, res) => {
  res.status(404).send("Page Not Found");
});


app.post("/posts/add", upload.single("featureImage"), (req, res) => {
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
    blog_service
      .addPost(req.body)
      .then(() => {
        res.redirect("/posts");
      })
      .catch((data) => {
        res.send(data);
      });
  });
});

app.get('/posts/add', (req, res) => {
  res.render('addPost');
})

blog_service
  .initialize()
  .then(() =>
  {
    app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`))
  })
  .catch(function (err) {
    console.log("Unable to open the file: " + err);
  });


