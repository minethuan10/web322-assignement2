const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema({
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

async function initialize() {
    return new Promise(async function (resolve, reject) {
        try {
            let db = mongoose.createConnection(`mongodb+srv://vdtr2808:vwbkDdhvjNkpRcYL@cluster0.qbgnaqa.mongodb.net/`);
            
            db.on('error', (err) => {
                reject(err);
            });
            db.once('open', () => {
                User = db.model("users", userSchema);
                resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}

async function registerUser(userData) {
    return new Promise(async function (resolve, reject) {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            try {
                let hash = await bcrypt.hash(userData.password, 10);
                userData.password = hash;

                let user = new User(userData);
                await user.save();
                resolve();
            } catch (err) {
                err.code === 11000 
                    ? reject("User Name already taken")
                    : reject(`There was an error creating the user: ${err}`);
            }
        }
    });
}

async function checkUser(userData) {
    let user = userData.userName;
    try {
        await initialize();
        let users = await User.find({ userName: userData.userName }).exec();

        if (users.length < 1) {
            throw new Error(`Unable to find user: ${user}`);
        } else {
            let result = await bcrypt.compare(userData.password, users[0].password);

            if (!result) {
                throw new Error(`Incorrect Password for user: ${user}`);
            } else {
                users[0].loginHistory.push({
                    dateTime: new Date().toString(),
                    userAgent: userData.userAgent
                });

                await User.updateOne(
                    { userName: users[0].userName },
                    { $set: { loginHistory: users[0].loginHistory } }
                );

                return resolve(users[0]);  // Fixed the missing 'return' statement here
            }
        }
    } catch (err) {
        throw new Error(`Error checking user: ${err}`);
    }
}

module.exports = {
    initialize,
    registerUser,
    checkUser
};
