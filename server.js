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
 let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            (error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
};

async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
}

upload(req).then((uploaded)=>{
    req.body.featureImage = uploaded.url;

    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts

});
app.post("/posts/add", upload.single("featureImage"), async (req, res) => {
  try {
    const uploaded = await upload(req);
    req.body.featureImage = uploaded.url;

    // Now, you can add the blog post using blogService
    const newPost = {
      // Create your post object here based on req.body
      // Example: title, content, author, etc.
    };

    blogService.addPost(newPost)
      .then(() => {
        res.redirect('/posts');
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading image to Cloudinary');
  }
});

});
app.get("/posts", (req, res) => {
  blogService
    .getAllPosts()
    .then((data) => {
      res.json(data);
    })
    .catch(function (err) {
      console.log("Unable to open the file: " + err);
    });
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
