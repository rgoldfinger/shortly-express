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

    });
  },

});

module.exports = User;
