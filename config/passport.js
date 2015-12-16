var passport = require('passport');
var local_strategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('user');

passport.use(new local_strategy(function(username, password, done) {
    User.findOne({username : username}, function(err, user) {
        if(err) { return done(err); }
        if(!user) { 
            return done(null, false, {message : 'invalid username'}); 
        }
        if(!user.valid_password(password)) {
            return done(null, false, {message : 'invalid password'});
        }
        return done(null, user);
    });
}));