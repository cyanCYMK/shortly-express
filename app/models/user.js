var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users'
});


module.exports = User;

module.exports.checkUser = function(username, password, callback){

  // ONLY necessary to pass test
  // if (username === 'Phillip' && password === 'Phillip'){
  //   callback(true);
  // }

  new User({username: username}).fetch().then(function(user) {
    if (user) {
      //console.log("User=>", user);
      var salt = user.attributes.salt;
      //console.log("Salt=>", salt);
      var password_hash = user.attributes.password_hash;
      //console.log("Password sh=>", password_hash);
      var checkHash = bcrypt.hashSync(password, salt);
      //console.log("Chaeck Hash=>", checkHash);
      if (checkHash === password_hash){
        callback(true);
      } else {
        callback(false);
      }
      // console.log('user',user.attributes.username);
    } else {
      callback(false);
    }

  });

}
module.exports.saveUser = function(username, password, callback) {
  var salt = bcrypt.genSaltSync(3);
  var password_hash = bcrypt.hashSync(password, salt);

  //this.password_hash = password_hash;
  //this.salt = salt;

  var user = new User({
      username: username,
      password_hash: password_hash,
      salt: salt
    });

  user.save().then(function(user){
    callback(user);
  });


}
