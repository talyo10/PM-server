
var exec = require('child_process').exec;
var q = require('q');
var path = require('path');
var REPOS_DIR = path.join("./","repos");

function executeCmd(cmd) {
	var deferred = q.defer();
	exec(cmd ,
		 function(error, stdout, stderr){
		 	console.log('--- cli output ---');
		 	console.log(stdout);
		 	console.log('--- cli output ---');
		 	console.log('--- error output ---');
		 	console.log(error)
		 	console.log('--- error output ---');
		 	console.log('--- stderr output ---');
		 	console.log(stderr)
		 	console.log('--- stderr output ---');
			if(error){
				return deferred.resolve({"error": stderr});
			}
			return deferred.resolve({"res": stdout, "stderr": stderr});
		 }
	);
	return deferred.promise;
}

function clone(url, destDir, branch) {
	return executeCmd("cd " + destDir + " && git clone " + url + " && git checkout " + branch);
}

function branchChanged(projectDir, branch, cb){
	executeCmd("cd " + projectDir + " && git fetch && " + "git diff-index origin/" + branch + " --").then(function (result){
		if(result.error){
			return cb(result);
		}
		else if(result.res === ""){
			return cb({"res": false});
		}
		else if(result.res && result.res){
			updateRepo(projectDir, branch, function(result){
				return cb({"res": true});
			});
		}
	});
}

function updateRepo(projectDir, branch, cb){
	executeCmd("cd " + projectDir + " && git fetch && " + "git pull --rebase origin " + branch + "").then(function (result){
		return cb(result);
	});
}

function checkRepo(user, url, branch, cb) {
	var userDir = path.join(REPOS_DIR, user);
	executeCmd("cd " + REPOS_DIR + " && mkdir " + user).then(function(result){
		clone(url, userDir, branch).then(function(obj) {
			if(!obj.stderr){
				return;
			}
			else {
				var dirName = obj.stderr.split("'");
				dirName = dirName[1];
				cb({res: path.join(userDir, dirName)});
			}
		});
	});
}

exports.clone = clone;

exports.branchChanged = branchChanged;

exports.checkRepo = checkRepo;


// checkRepo("bitton", "https://github.com/lolporer/testPM.git", function(result){
// 	console.log(result);
// });


// git diff-index --quiet HEAD --