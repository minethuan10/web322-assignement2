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
        let db = mongoose.createConnection("mongodb+srv://Minethuan10:HX83ouqIccXS9ToR@cluster0.y7m9oqw.mongodb.net/");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = async (userData) => {
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

module.exports.checkUser = async (userData) => {
    try {
        const users = await User.find({ userName: userData.userName }).exec();

        if (users.length === 0) {
            throw new Error('Unable to find user:' + userData.userName);
        }

        const result = await bcrypt.compare(userData.password, users[0].password);

        if (result) {
            if (!users[0].loginHistory) {
                users[0].loginHistory = [];
            }

            users[0].loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
            });

            await User.updateOne(
                { userName: users[0].userName },
                { $set: { loginHistory: users[0].loginHistory } }
            ).exec();

            return Promise.resolve(users[0]);
        } else {
            return Promise.reject('Incorrect password:' + userData.userName);
        }
    } catch (err) {
        return Promise.reject('Unable to find user:' + userData.userName);
    }
};