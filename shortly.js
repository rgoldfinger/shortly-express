var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser())
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser('s3cr3t'));
  app.use(express.session());
});

app.get('/', util.isValidSession, function(req, res) {
  res.render('index');
});

app.get('/create', util.isValidSession,function(req, res) {
  res.render('index');
});

app.get('/links', util.isValidSession,function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
});

app.post('/links', util.isValidSession,function(req, res) {
  var uri = req.body.url;

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
          //TODO: Pull the user_id from the session and add to link
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
// if the user isn't found return false
// if the user is in the datbase, compare passwords
// if matches, true
//



app.get('/login', function(req, res) {
  res.render('login');
});

// Get the username and password from the request
// Send to our authentication handler
app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  util.isAuthenticated(username, password, function(wasFound) {
    if (wasFound) {
      //TO DO: Set the session
      util.createSession(req,res,username);
    } else {
      res.redirect('/login');
    }
  });

});

app.get('/signup', function(req,res){
  res.render('signup');
});

// check if username already exists
app.post('/signup',function(req,res){
  var username = req.body.username;
  var password = req.body.password;
  new User({username:username, password:password}).fetch().then(function(found){
    if(found){
      // TODO: modify login to display error message
      res.send(200,'User already exists');
    } else {
      bcrypt.genSalt(10,function(err, salt){
        bcrypt.hash(password, salt, function(){},function(err, hash){
          //save to database
          var user = new User({
            username:username,
            password:hash,
            salt:salt
          });

          user.save().then(function(newUser){
            Users.add(newUser);
            util.createSession(req,res,username);
          });
        });
      });
    }
  });//end
});

//TODO: add logout links
app.get('/logout', function(req,res){
  if(req.session){
    req.session.destroy(function(){
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

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
