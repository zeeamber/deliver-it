var events = require('events');
var eventEmitter = new events.EventEmitter();
var mongoose = require('mongoose');
var Task = mongoose.model('task');

var newTaskHandler = function() {
    console.log('waiting for new task to be added');
    Task.findOne({status : 'pending'}, function(err, task) {
        if(err) { return 0; }
        if(!task) { eventEmitter.emit('newTask'); }
        console.log('task is being assigned');
    });
};

eventEmitter.on('newTask', newTaskHandler);

exports.emitNewTaskEvent = function() {
    eventEmitter.emit('newTask');
}