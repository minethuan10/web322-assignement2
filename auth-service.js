const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

let User;

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb://localhost:27017");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // Check if passwords match
    if (userData.password !== userData.password2) {
      reject('Passwords do not match');
      return;
    }

    // Hash the password
    bcrypt.hash(userData.password, 10)
      .then((hash) => {
        // Create a new User from userData
        let newUser = new User({
          userName: userData.userName,
          password: hash,
          email: userData.email,
          loginHistory: [],
        });

        // Save the user to the database
        newUser.save()
          .then(() => {
            resolve();
          })
          .catch((err) => {
            // Check for duplicate key error
            if (err.code === 11000) {
              reject('User Name already taken');
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch((err) => {
        reject('There was an error encrypting the password');
      });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // Find the user in the database
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
          return;
        }

        // Compare passwords
        bcrypt.compare(userData.password, users[0].password)
          .then((result) => {
            if (!result) {
              reject(`Incorrect Password for user: ${userData.userName}`);
              return;
            }

            // Record login history
            const loginInfo = {
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            };

            users[0].loginHistory.push(loginInfo);

            // Update login history in the database
            User.updateOne(
              { userName: users[0].userName },
              { $set: { loginHistory: users[0].loginHistory } }
            )
              .then(() => {
                resolve(users[0]); // Resolve with the user object
              })
              .catch((err) => {
                reject(`There was an error verifying the user: ${err}`);
              });
          })
          .catch((err) => {
            reject(`There was an error comparing passwords: ${err}`);
          });
      })
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
};
