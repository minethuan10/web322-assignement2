/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Vu Duc Thuan Tran Student ID: 121804223 Date: 27/9/23
*
*  Online (Cyclic) Link:  https://happy-pleat-elk.cyclic.cloud/
*
********************************************************************************/ 

const express = require('express');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
 // "require" the Express module
 cloudinary.config({
  cloud_name: 'dwnhc9gwu',
  api_key: '393935347294981',
  api_secret: 'S0SclRPOmJvnc3T7bjSYoloDQRg',
  secure: true
});
const upload = multer(); 
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // assign a port
const blogService = require("./blog-service.js");
app.post("/posts/add", upload.single("featureImage"), async (req, res) => {
  try {
    // The uploaded file can be accessed using req.file
    const uploadedFile = req.file;

    if (uploadedFile) {
      console.log("Uploaded file:", uploadedFile);

      // Use the file path or other relevant information
      req.body.featureImage = uploadedFile.path;

      // Create the new blog post object based on the form data
      const newPost = {
        title: req.body.title,
        body: req.body.body,
        category: parseInt(req.body.category),
        published: req.body.published === 'on', // Check the checkbox value
        featureImage: req.body.featureImage,
      };

      console.log("New post data:", newPost);

      // Now, you can add the blog post using blogService
      blogService.addPost(newPost)
        .then((addedPost) => {
          res.redirect('/posts');
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Internal Server Error');
        });
    } else {
      res.status(400).send('No file uploaded');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading image to Cloudinary');
  }
});

app.get('/', (req, res) => {
    res.redirect('/about');
  });
  app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/views/about.html");
  });
app.use(express.static('public'));
app.get("/blog", (req, res) => {
  blogService
    .getPublishedPosts()
    .then((data) => {
      res.json(data);
    })
    .catch(function (err) {
      console.log("Unable to open the file: " + err);
    });
});
app.get("/posts/add",(req,res)=>{
 res.sendFile(__dirname+"/views/addPost.html");
 upload.single("featureImage");
});

app.get("/posts", (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    // Filter by category
    blogService
      .getPostsByCategory(parseInt(category)) // Assuming category is an integer
      .then((data) => {
        res.json(data);
      })
      .catch(function (err) {
        console.log("Unable to fetch posts by category: " + err);
        res.status(500).send('Internal Server Error');
      });
  } else if (minDate) {
    // Filter by minimum date
    blogService
      .getPostsByMinDate(minDate) // Assuming minDate is in "YYYY-MM-DD" format
      .then((data) => {
        res.json(data);
      })
      .catch(function (err) {
        console.log("Unable to fetch posts by minDate: " + err);
        res.status(500).send('Internal Server Error');
      });
  } else {
    // Return all posts without any filter
    blogService
      .getAllPosts()
      .then((data) => {
        res.json(data);
      })
      .catch(function (err) {
        console.log("Unable to open the file: " + err);
        res.status(500).send('Internal Server Error');
      });
  }
});

app.get("/categories", (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.json(data);
    })
    .catch(function (err) {
      console.log("Unable to open the file: " + err);
    });
});

app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/views/404/error.html");
});

blogService
.initialize()
.then(function(){
  app.listen(HTTP_PORT, () => console.log(`Express http server listening on: ${HTTP_PORT}`));
  })
  .catch(function(err){
    console.log("Unable to open file: "+ err);
  })