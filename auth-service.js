const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');


dotenv.config();

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_CLUSTER = process.env.MONGO_CLUSTER;
const MONGO_DATABASE = process.env.MONGO_DATABASE;

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    email: String,
    loginHistory: {
        type: [{
            dateTime: Date,
            userAgent: String,
        }],
        default: [],
    },
});

let User;

initialize = () => {
    return new Promise(function (resolve, reject) {
        const uri = `mongodb+srv://vdtr2808:vwbkDdhvjNkpRcYL@cluster0.qbgnaqa.mongodb.net/?retryWrites=true&w=majority`;
        
        let db = mongoose.createConnection(uri);

        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) reject('Passwords do not match!');
        else {
            bcrypt.hash(userData.password, 10) 
                .then(hash => {
                    let newUser = new User({
                        userName: userData.userName,
                        password: hash, 
                        email: userData.email,
                        loginHistory: [] 
                    });
                    newUser.save()
                        .then(() => resolve())
                        .catch(err => {
                            if (err.code === 11000) reject("Username already taken");
                            else reject('There was an error creating the user: ${err}');
                        });
                })
                .catch(err => {
                    console.log(err); 
                    reject('There was an error encrypting the password');
                });
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName }).exec()
            .then(user => {
                if (!user) reject('Incorrect username');
                else {
                    bcrypt.compare(userData.password, user.password).then(result => {
                        if (result) {
                            user.loginHistory.push({
                                dateTime: new Date(),
                                userAgent: userData.userAgent
                            });
                            User.updateOne({ userName: user.userName }, { $set: { loginHistory: user.loginHistory } })
                                .then(() => resolve(user))
                                .catch(newErr => reject('There was an error updating the user login history: ${newErr}'));
                        } 
                        else reject('Incorrect Password for user: ${userData.userName}');
                    });
                }
            })
            .catch(error => { reject('Unable to find user: ${userData.userName}'); });
    });
}

module.exports = {
    initialize,
    registerUser,
    checkUser,
}
