var request = require('request');
var User = require('../app/models/user');
var bcrypt = require('bcrypt-nodejs');



exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/
// TODO: read how express.session works
exports.createSession = function(req,res, username){
  req.session.regenerate(function(){
    req.session.user = username;
    req.session.cookie.maxAge = 3600000;
    res.redirect('/');
  });
};

exports.isValidSession = function(req,res,next){
  if(req.session && req.session.user){
    next();
  } else {
    // req.session.error = 'Access denied';
    res.redirect('/login');
  }
};


exports.isAuthenticated = function(username, password, callback){
  new User({username:username}).fetch().then(function(user){
    if(!user){
      callback(false);
    } else {

      bcrypt.compare(password, user.get('password'),function(err,res){

        if(res){
          callback(true);
        } else {
          callback(false);
        }


      });
    }
  });

};



