var app = angular.module('deliver-it', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url : '/home',
        templateUrl : '/home.html',
        controller : 'MainCtrl',
        onEnter : ['$state', 'auth', function($state, auth) {
            if(auth.is_logged_in()) {
                $state.go('dashboard');
            }
        }]
    }).state('register', {
        url : '/client/register',
        templateUrl : '/register.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth', function($state, auth) {
            if(auth.is_logged_in()) {
                $state.go('dashboard');
            }
        }]
    }).state('login', {
        url : '/client/login',
        templateUrl : '/login.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth', function($state, auth) {
            if(auth.is_logged_in()) {
                $state.go('dashboard');
            }
        }]
    }).state('dashboard', {
        url : '/client/dashboard',
        templateUrl : '/dashboard.html',
        controller : 'DashboardCtrl',
        resolve : {
            postPromise : ['clientTaskFctry', function(tasks) {
                return tasks.get_all();
            }]
        }
    }).state('admindashboard', {
        url : '/admin/dashboard',
        templateUrl : '/admindashboard.html',
        controller : 'AdminDashboardCtrl',
        resolve : {
            postPromise : ['taskFctry', function(tasks) {
                return tasks.get_all();
            }]
        }
    }).state('createtask', {
        url : '/client/createtask',
        templateUrl : '/createtask.html',
        controller : 'DashboardCtrl',
    }).state('adminlogin', {
        url : '/admin/login',
        templateUrl : '/adminlogin.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth', function($state, auth) {
            if(auth.is_logged_in()) {
                $state.go('admindashboard');
            }
        }]
    }).state('createagent', {
        url : '/admin/createagent',
        templateUrl : '/createagent.html',
        controller : 'AdminDashboardCtrl',
    });
    $urlRouterProvider.otherwise('home');
});

app.factory('taskFctry', ['$http', function($http) {
    
    var tasks = {tasks : []};
    tasks.get_all = function() {
        return $http.get('/tasks').success(function(data) {
            angular.copy(data, tasks.tasks);
        });
    };
    return tasks;
}]);

app.factory('agentFctry', ['$http', 'auth', function($http, auth) {
    
    var agents = {agents : []};
    agents.get_all = function() {
        return $http.get('/agents').success(function(data) {
            angular.copy(data, agents.agents);
        });
    };
    agents.create = function(agent) {
        var requestURL = '/admin/createagent';
        return $http.post(requestURL, agent, {
            headers: {Authorization: 'Bearer '+auth.get_token()}
        }).success(function(data) {
            agents.agents.push(data);
        });
    };
    return agents;
}]);

app.factory('clientTaskFctry', ['$http', 'auth', function($http, auth) {
    var tasks = {tasks : []};
    tasks.get_all = function() {
        var requestURL = '/client/' + auth.current_user() +'/tasks';
        return $http.get(requestURL, {
            headers: {Authorization: 'Bearer '+auth.get_token()}
        }).success(function(data) {
            angular.copy(data, tasks.tasks);
        });
    };
    tasks.create = function(task) {
        var requestURL = '/client/' + auth.current_user() + '/newtask';
        return $http.post(requestURL, task, {
            headers: {Authorization: 'Bearer '+auth.get_token()}
        }).success(function(data) {
            tasks.tasks.push(data);
        });
    };
    return tasks;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
            var auth = {};
    auth.save_token = function(token) {
        $window.localStorage['deliver-it'] = token;
    };
    auth.get_token = function() {
        return $window.localStorage['deliver-it'];
    };
    auth.is_logged_in = function() {
        var token = auth.get_token();
        if(token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        }
        else { return false; }
    };
    auth.current_user = function() {
        if(auth.is_logged_in()) {
            var token = auth.get_token();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.username;
        }
    };
    auth.register = function(user) {
        return $http.post('/client/register', user).success(function(data){
            auth.save_token(data.token);
        });
    };
    auth.login = function(user) {
        return $http.post('/client/login', user).success(function(data){
            auth.save_token(data.token);
        });
    };
    auth.adminlogin = function(user) {
        return $http.post('/admin/login', user).success(function(data){
            auth.save_token(data.token);
        });
    };
    auth.logout = function() {
        $window.localStorage.removeItem(['deliver-it']);
    };
    return auth;
}]);

app.controller('HeaderCtrl', ['$scope', function($scope) {

}]);

app.controller('MainCtrl',['$scope', 'taskFctry', 'auth', function($scope, taskFctry, auth) {
    $scope.tasks = taskFctry.tasks;
    $scope.logout = auth.logout;
}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
    $scope.user = {};
    $scope.register = function() {
        auth.register($scope.user).error(function(err) {
            $scope.error= err;
        }).then(function() {
            $state.go('home');
        });
    };
    $scope.login = function() {
        auth.login($scope.user).error(function(err) {
            $scope.error = err;
        }).then(function() {
            $state.go('dashboard');
        });
    };
    $scope.adminlogin = function() {
        auth.adminlogin($scope.user).error(function(err) {
            $scope.error = err;
        }).then(function() {
            $state.go('admindashboard');
        });
    };
}]);

app.controller('DashboardCtrl', ['$scope', '$state', 'clientTaskFctry', 'auth', function($scope, $state, clientTaskFctry, auth) {
    $scope.tasks = clientTaskFctry.tasks;
    $scope.logout = function() {
        auth.logout();
        $state.go('home');
    };
    $scope.create_task = function() {
        clientTaskFctry.create($scope.task).error(function(err) {
            $scope.error = err;
        }).then(function() {
            $state.go('dashboard');
        });
    };
}]);

app.controller('AdminDashboardCtrl', ['$scope', '$state', 'taskFctry', 'agentFctry', 'auth', function($scope, $state, taskFctry, agentFctry, auth) {
    $scope.tasks = taskFctry.tasks;
    $scope.logout = function() {
        auth.logout();
        $state.go('home');
    };
    $scope.create_agent = function() {
        agentFctry.create($scope.agent).error(function(err) {
            $scope.error = err;
        }).then(function() {
            $state.go('admindashboard');
        });
    };
}]);
    