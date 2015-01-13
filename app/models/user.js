var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users'
});

module.exports = User;

module.exports.checkUser = function(username, password, callback){
  new User({username: username}).fetch().then(function(user) {
    if (user) {
      console.log("User=>", user);
      var salt = user.attributes.salt;
      console.log("Salt=>", salt);
      var password_hash = user.attributes.password_hash;
      console.log("Password sh=>", password_hash);
      var checkHash = bcrypt.hashSync(password, salt);
      console.log("Chaeck Hash=>", checkHash);
      if (checkHash === password_hash){
        callback(true);
      } else {
        callback(false);
      }
      // console.log('user',user.attributes.username);
    }
  });

}
