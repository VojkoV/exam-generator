const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    // name: {
    //     first:{type:String,required:true},
    //     last: {type:String,required:false}
    // },
    username: {type:String,required: true,trim: true},
    email: {type:String,unique: true,required: true,trim: true},
    password: {type:String,required:true},
    folders: {type:[String]}
})

//authenticate input against database
UserSchema.statics.authenticate = function (email, password, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } 
      else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return callback(null, user);
        } 
        else {
          return callback();
        }
      })
    });
}

// Check if an account with the given email already exists
UserSchema.statics.exists = function (email, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } 
      else if (user) {
        return callback(null,true);
      }
      else{
        return callback(null,false);
      }
    });
}


//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});

var User = mongoose.model('User', UserSchema);
module.exports = User;