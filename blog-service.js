
const { rejects } = require("assert");
const file = require("fs"); // required at the top of my module
const { resolve } = require("path");

//Module Data
var posts = [];
var categories = [];

//initialize()
//•	This function will read the contents of the "./data/posts.json" and "./data/categories.json" file

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
};
  