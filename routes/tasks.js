var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Task = mongoose.model('task');
var Agent = mongoose.model('agent');
var jwt = require('express-jwt');
var auth = jwt({secret : 'SECRET', userProperty : 'payload'});

/* GET all tasks */
router.get('/', function(req, res, next) {
    Task.find(function(err, tasks) {
        if(err) {return next(err);}
        res.json(tasks);
    });
});

/* Map URL param task */
router.param('task', function(req, res, next, id) {
    var query = Task.findById(id);
    query.exec(function(err, task) {
        if(err) { return next(err); }
        if(!task) { return next(new Error('can not find task')); }
        
        req.task = task;
        return next();
    });
});

/* Map URL param status */
router.param('status', function(req, res, next, st) {
    req.status = st;
    return next();
});

/* Map URL param agent */
router.param('agent', function(req, res, next, id) {
    var query = Agent.findById(id);
    query.exec(function(err, agent) {
        if(err) { return next(err); }
        if(!agent) { return next(new Error('no agent found')); }
        
        req.agent = agent;
        return next();
    });
});


/* GET a single task */
router.get('/:task', function(req, res, next) {
    res.json(req.task);
});

/* Create a task */
router.post('/', auth, function(req, res, next) {
    var task = new Task(req.body);
    task.save(function(err, task) {
        if(err) { return next(err); }
        res.json(task);
    });
});

/* Update task status */
router.put('/:task/update/:status', auth, function(req, res, next) {
    req.task.updateStatus(req.status, function(err, task) {
        if(err) { return next(err); }
        res.json(task);
    });
});

/* Assign task to an agent */
router.put('/:task/assign/:agent', auth, function(req, res, next) {
    req.task.assign(req.agent, function(err, task) {
        if(err) { return next(err); }
        req.agent.appendTask(req.task, function(err, agent) {
            if(err) { return next(err); }
            res.json(task);
        });
    });
});

module.exports = router;
