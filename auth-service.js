const bcrypt = require('bcryptjs');

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var userSchema = new Schema({
    "userName": {
        type: String,
        required: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User;

initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(`mongodb+srv://vdtr2808:vwbkDdhvjNkpRcYL@cluster0.qbgnaqa.mongodb.net/`);
        
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


function registerUser(userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt
            .hash(userData.password, 10)
            .then((hash) => {
                userData.password = hash;
                let user = new User(userData);
                user.save()
                .then(() => resolve())
                .catch(err => {
                    err.code === 11000 
                        ? reject("User Name already taken")
                        : reject(`There was an error creating the user: ${err}`);

                })
            })
        }
    });
};

function checkUser(userData) {
    let user = userData.userName;
    return new Promise(function (resolve, reject) {
        // User.find().then(users => console.log(users))
        User.find({ userName: userData.userName })
        .exec()
        .then(users => {
            if (users.length < 1) {
                reject(`Unable to find user: ${user}`);
            } else {
                bcrypt
                .compare(userData.password, users[0].password)
                .then((result) => {
                    if (!result)
                        reject(`Incorrect Password for user: ${user}`);
                    else {
                        users[0].loginHistory.push({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });
                        User.updateOne(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } })
                            .then(() => resolve(users[0]))
                            .catch(err => reject(`There was an error verifying the user: ${err}`));
                    }
                }).catch(err => reject(`Unable to find user: ${user}`))
            }
        })
    });
};


module.exports = {
    initialize,
    registerUser,
    checkUser
};