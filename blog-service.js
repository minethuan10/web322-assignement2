
const Sequelize = require('sequelize');
var sequelize = new Sequelize('Senecadb', 'minethuan10', 'V28WdmGXMsUc', {
    host: 'ep-super-cherry-77358541.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


const Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
});

const Category = sequelize.define('Category', {
  category:Sequelize.STRING,
});

Post.belongsTo(Category, {foreignKey: 'category'});

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject("unable to sync the database");
      });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        data.length > 0 ? resolve(data) : reject("No results returned");
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching all posts");
      });
  });
}

function getPostsByCategory(selectedCat) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      include: [
        {
          model: Category, // model = collection name
          where: { id: selectedCat },
        },
      ],
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching posts by category");
      });
  });
}

const { Op } = require("sequelize");

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [Op.gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching posts by min date");
      });
  });
}

function getPostById(postId) {
  return new Promise((resolve, reject) => {
    Post.findByPk(postId)
      .then((post) => {
        if (post) {
          resolve(post); // post is already a single object, no need for data[0]
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching a post by ID: ", err);
      });
  });
}

function addPost(postData) {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;

    for (let prop in postData) {
      if (postData[prop] === "") postData[prop] = null; // Replace any empty string values with null
    }

    postData.postDate = new Date();

    Post.create(postData)
      .then((post) => {
        resolve(post);
      })
      .catch((err) => {
        console.error(err);
        reject("unable to create post");
      });
  });
}

function addCategory(categoryData) {
  console.log("CATE", categoryData);
  return new Promise((resolve, reject) => {
    // for (let prop in categoryData) {
      if (categoryData === "") categoryData = null;
      console.log(categoryData);
    // }

    Category.create(categoryData)
      .then((category) => {
        resolve(category);
      })
      .catch((err) => {
        console.error(err);
        reject("unable to create category");
      });
  });
}

// function deleteCategoryById(categoryID) {
//   console.log(categoryID);
//   return new Promise((resolve, reject) => {
//       Category.findByPk(categoryID).then((categoryData)=>{
//         Category.destroy(categoryData);
//         resolve();
//       }).catch((err)=>{
//         console.error(err);
//         reject("unable to delete category");
//       })
//   });
// }

function deleteCategoryById(categoryID) {
  // console.log(categoryID);
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: categoryID }
    }).then(() => {
      resolve();
    }).catch((err) => {
      console.error(err);
      reject("unable to delete category");
    });
  });
}


// function deletePostById(postID) {
//   return new Promise((resolve, reject) => {
//     Post.findByPk({
//       where: {id: postID}
//     }).then((postData)=>{
//       Post.destroy(postData);
//       resolve();
//     }).catch((err)=>{
//       console.error(err);
//       reject("unable to delete post");
//     })
//   });
// }

function deletePostById(postID) {
    console.log(postID);
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: { id: postID }
    }).then(() => {
      resolve();
    }).catch((err) => {
      console.error(err);
      reject("unable to delete post");
    });
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: { published: true },
    })
      .then((data) => {
        data.length > 0 ? resolve(data) : reject("No results returned");
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching published posts");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        data.length > 0 ? resolve(data) : reject("No results returned");
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching categories");
      });
  });
}

function getPublishedPostsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
        category: categoryId, // Replace 'categoryId' with the actual column name in your model
      },
    })
      .then((data) => {
        data.length > 0 ? resolve(data) : reject("No results returned");
      })
      .catch((err) => {
        console.error(err);
        reject("Error occurred while fetching published posts by category");
      });
  });
}
module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  getPublishedPostsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};