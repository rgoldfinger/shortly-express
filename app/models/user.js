var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');
var crypto = require('crypto');

var User = db.Model.extend({
  tableName:'users',
  hasTimestamps: true,
  clicks: function(){
    return this.hasMany(Link);
  },

  initialize: function(){
    //code here
    // TODO: should this be in initialize???????
    this.on('creating', function(model, attrs, options){
      bcrypt.genSalt(10,function(err, salt){
        console.log('User creating');
        var tmp = model.get('password');

        bcrypt.hash(tmp, salt, function(){},function(err, hash){
          //save to database
          model.set('salt', salt);
          model.set('password', hash);
        });
      });
    });
  },
});

module.exports = User;
