const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FolderSchema = new Schema({
    name: {type:String,required:true},
    questions: {type:[String], default: []}
})

FolderSchema.statics.addQuestion = function (_id, qiestion, callback) {
    User.findOne({ email: email },)
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
var Folder = mongoose.model('Folder', FolderSchema);
module.exports = Folder;