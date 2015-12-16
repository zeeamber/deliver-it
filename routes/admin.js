var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Task = mongoose.model('task');
var Agent = mongoose.model('agent');
var User =  mongoose.model('user');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret : 'SECRET', userProperty : 'payload'});

var kue = require('kue');
var queue = kue.createQueue();

/* Register a new admin */
router.post('/register', function(req, res, next) {
    if(!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'please fill out all fields'});
    }
    
    var user = new User();
    user.username = req.body.username;
    user.set_password(req.body.password);
    user.role = 'admin';
    
    user.save(function(err) {
        if(err) { return next(err); }
        return res.json({token : user.generateJWT()});
    });
});

/* Login admin */
router.post('/login', function(req, res, next) {
    if(!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'please fill out all fields'});
    }
    
    passport.authenticate('local', function(err, user, info) {
        if(err) { return next(err); }
        if(user) {
            return res.json({token : user.generateJWT()});
        }
        else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

/* Create a new agent */
router.post('/createagent', auth, function(req, res, next) {
    var agent = new Agent(req.body);
    agent.save(function(err, agent) {
        if(err) { return next(err); }
        queue.create('idle_agents', agent).save();
        res.json(agent);
    });
});

/* Map URL param username */
router.param('username', function(req, res, next, username) {
    var query = User.findOne({username : username});
    query.exec(function(err, user) {
        if(err) { return next(err); }
        if(!user) { return next(new Error('can not find user')); }
        
        req.user = user;
        return next();
    });
});

/* GET all tasks */
router.get('/:username/tasks', auth, function(req, res, next) {
    //var userObj = User.findOne({username : req.username});
    var query = Task.find({client : req.user._id});
    query.exec(function(err, tasks) {
        if(err) {return next(err);}
        res.json(tasks);
    });
});

/* Create a new task */
router.post('/:username/newtask', auth, function(req, res, next) {
    if(!req.body.pickup_add || !req.body.shipping_add) {
        return res.status(400).json({message: 'please fill out all fields'});
    }
    var task = new Task();
    task.client = req.user._id;
    task.pick_up_address = req.body.pickup_add;
    task.shipping_address = req.body.shipping_add;
    task.save(function(err, task) {
        if(err) { return next(err); }
        var job = queue.create('pending_tasks', task).save();
        res.json(task);
    });
});

module.exports = router;