var mongoose = require('mongoose');

var task_schema = new mongoose.Schema({
    date : {type : Date, default : Date.now() },
    client : {type : mongoose.Schema.Types.ObjectId, ref : 'client'},
    assigned_to : {type : mongoose.Schema.Types.ObjectId, ref : 'agent'},
    status : {type :String, default : 'pending'},
    pick_up_address : String,
    shipping_address : String
});

task_schema.methods.updateStatus = function(new_status, cb) {
    this.status = new_status;
    this.save(cb);
};

task_schema.methods.assign = function(agent, cb) {
    this.assigned_to = agent._id;
    this.status = 'assigned';
    this.save(cb);
};

mongoose.model('task', task_schema);