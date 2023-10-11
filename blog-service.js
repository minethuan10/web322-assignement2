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

const { rejects } = require("assert");
const file = require("fs"); // required at the top of my module
const { resolve } = require("path");

//Module Data
var posts = [];
var categories = [];

//initialize()
//•	This function will read the contents of the "./data/posts.json" and "./data/categories.json" file
// blog-service.js

 // Assuming you have an array to store posts
// blog-service.js

// Assuming you have an array called 'posts' containing your blog posts

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter((post) => post.category === category);
    
    if (filteredPosts.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredPosts);
    }
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter((post) => {
      return new Date(post.postDate) >= new Date(minDateStr);
    });
    
    if (filteredPosts.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredPosts);
    }
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    const foundPost = posts.find((post) => post.id === id);
    
    if (foundPost) {
      const formattedPost = {
        id: foundPost.id,
        title: foundPost.title,
        body: foundPost.content,
        postDate: foundPost.postDate,
        category: foundPost.category,
        featureImage: foundPost.featureImage,
        published: foundPost.published
      };
      resolve(formattedPost);
    } else {
      reject("No result returned");
    }
  });
}


function addPost(postData) {
  return new Promise((resolve, reject) => {
    if (typeof postData.published === 'undefined') {
      postData.published = false;
    } else {
      postData.published = true;
    }
    
    postData.id = posts.length + 1;
    
    posts.push(postData);
    
    resolve(postData);
  });
}



initialize = function () {
  return new Promise((resolve, reject) => {
    file.readFile("./data/posts.json", "utf8", (err, data) => {
      if (err) {
        reject("unable to read file");
      } else {
        posts = JSON.parse(data);
      }
    });

    file.readFile("./data/categories.json", "utf8", (err, data) => {
      if (err) {
        reject("unable to read file");
      } else {
        categories = JSON.parse(data);
      }
    });
    resolve();
  });
};

getAllPosts = function () {
  return new Promise((res, rej) => {
    if (posts.length === 0) {
      rej("no results returned");
    } else {
      res(posts);
    }
  });
};

getPublishedPosts = function () {
  return new Promise((res, rej) => {
    var filteredPosts = [];
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].published === true) {
        filteredPosts.push(posts[i]);
      }
    }

    if (filteredPosts.length === 0) {
      rej("no results returned");
    } else {
      res(filteredPosts);
    }
  });
};

getCategories = function () {
  return new Promise((res, rej) => {
    if (categories.length === 0) {
      rej("no results returned");
    } else {
      res(categories);
    }
  });
};

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
};