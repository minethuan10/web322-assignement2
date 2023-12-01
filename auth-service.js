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

registerUser = async (userData) => {
    try {
        if (userData.password !== userData.password2) {
            throw new Error('Passwords do not match');
        }

        const hash = await bcrypt.hash(userData.password, 10);
        userData.password = hash;

        const newUser = new User(userData);
        await newUser.save();

        return Promise.resolve();
    } catch (err) {
        if (err.code === 11000) {
            return Promise.reject('User Name already taken');
        } else {
            return Promise.reject('There was an error creating the user: ' + err);
        }
    }
};

function checkUser(userData) {
    let user = userData.userName;
    return new Promise(function (resolve, reject) {
        // User.find().then(users => console.log(users))
        User.find({ userName: user })
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
    checkUser,
}