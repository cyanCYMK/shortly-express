var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(session({
  secret: 'nyancat'
}));


app.get('/',
function(req, res) {
  // console.log('req.session:',req.session);
  // if authenticated
  if (req.session.username){
    res.render('index');
  } else {
    res.redirect('login');
  }
});

app.get('/create',
function(req, res) {
  if (req.session.username){
    res.render('index');
  } else {
    res.redirect('login');
  }
});

app.get('/links',
function(req, res) {
  if (req.session.username){
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.send(405);
  }
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/signup',
  function(req, res){
    res.render('signup');
  });

app.get('/logout',
  function(req,res){
    // trash cookie
    console.log('logging out');
    req.session.destroy();
    // redirect to homepage (which redirects to login)
    res.redirect('/');
  })

app.post('/links',
function(req, res) {
  console.log("url=",req.url);
  console.log("body=",req.body);
  var uri = req.body.url;
  console.log(uri);
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/login',
function(req,res){
  // console.log('login post body:',req.body);
  // return res.send(200);
  User.checkUser(req.body.username, req.body.password, function(success){
    if ( success ){
      req.session.username = req.body.username;
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  });


});

app.post('/signup',
  function(req,res){

    var salt = bcrypt.genSaltSync(3);
    var password_hash = bcrypt.hashSync(req.body.password, salt);

    var user = new User({
      username: req.body.username,
      password_hash: password_hash,
      salt: salt
    });






    console.log("User obj=>", user);
    user.save().then(function(user){
      //Users.add(user);
      console.log('new user added:', user);
      req.session.username = req.body.username;
      res.redirect('/');
    });
  });



/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
