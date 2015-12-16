var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Agent = mongoose.model('agent');
var Task = mongoose.model('task');
var jwt = require('express-jwt');
var auth = jwt({secret : 'SECRET', userProperty : 'payload'});

var kue = require('kue');
var queue = kue.createQueue();

/* GET all agents */
router.get('/',function(req, res, next) {
    Agent.find(function(err, agents) {
        if(err) { return next(err); }
        res.json(agents);
    });
});

/* Create a new agent */
router.post('/', auth, function(req, res, next) {
    var agent = new Agent(req.body);
    agent.save(function(err, agent) {
        if(err) { return next(err); }
        queue.create('idle_agents', agent).save();
        res.json(agent);
    });
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

/* Map URL param status */
router.param('status', function(req, res, next, st) {
    req.status = st;
    return next();
});

/* Pick a task */
router.put('/:agent/picknewtask', auth, function(req, res, next) {
    req.agent.pickup_task(function(err, agent) {
        if(err) { return next(err); }
        Task.findById(agent.current_task).exec(function(err, task) {
            if(err) { return next(err); }
            if(!task) { return next( new Error('task not found') ); }
            task.status = 'picked';
            task.save();
        });
        res.json(agent);
    });
});

/* Update task status */
router.put('/:agent/updatetaskstatus/:status', auth, function(req, res, next) {
    var query = Task.findById(req.agent.current_task);
    query.exec(function(err, task) {
        if(err) { return next(err); }
        if(!task) { return next(new Error('task not found')); }
        task.updateStatus(req.status, function(err, task) {
            if(err) { return next(err); }
        });
        res.json(task);
    });
});

module.exports = router;