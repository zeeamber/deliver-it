var mongoose = require('mongoose');

var agent_schema =  new mongoose.Schema({
    name : String,
    phone_number : Number,
    status : {type : String, default : 'free'},
    current_task : {type : mongoose.Schema.Types.ObjectId, ref : 'task'},
    task_pending : [{type : mongoose.Schema.Types.ObjectId, ref : 'task'}]
});

agent_schema.methods.appendTask = function(task,cb) {
    this.task_pending.addToSet(task._id);
    this.status = 'busy';
    this.save(cb);
};

agent_schema.methods.pickup_task = function(cb) {
    var new_task = this.task_pending.pop();
    if(new_task) {
        this.current_task = new_task;
    }
    this.save(cb);
};

mongoose.model('agent', agent_schema);