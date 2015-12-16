var request = require('request');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var mongoose = require('mongoose');
var Agent = mongoose.model('agent');
var Task = mongoose.model('task');

var kue = require('kue');
var queue = kue.createQueue();

var getNewTask = function() {
    queue.process('idle_agents', function(agent, done) {
        if(!agent) { return ;}
        queue.process('pending_tasks', function(job, done) {
            if(!job) {
                queue.create('idle_agents', agent.data).save();
            }
            assignTask(job.data, done, agent.data);
        });
    });
};

var assignTask = function(task, done, agent) {
    console.log('task is being assigned');
    var query = Task.findById(task._id);
    query.exec(function(err, task) {
        if(!err) {
            task.assign(agent, function(err, task) {
                if(!err) {
                    var query = Agent.findById(agent._id);
                    query.exec(function(err,agent) {
                        if(!err) {
                            agent.appendTask(task, function(err, agent) {
                                if(err) { console.log('error occured while appending task to agent'); }
                            });
                        }
                    });
                }
            });
        }
    });
}

eventEmitter.on('assign', getNewTask);

var callback = function() {
    eventEmitter.emit('assign');
}

exports.emitAssignTaskEvent = function() {
    setInterval(callback,30000);
}