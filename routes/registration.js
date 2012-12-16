var schemas =require("../models/models.js");
var fs = require("fs");

exports.getsingle=function(req, res) {
	res.sendfile(req.path);
}

//User is added to the database, and page is redirected to confirm the registration
exports.signup=function(req, res) {
	if (req.body.signupusername=="" || req.body.signuppassword=="") {
		res.render('index', {message: "Missing credentials", fromsignup:'true' });
		return;
	}
	var myRegxp = /^([a-zA-Z0-9_-]){3,10}$/;
	if(myRegxp.test(req.body.signupusername) == false|| myRegxp.test(req.body.signuppassword) == false)
	{
	    res.render('index', { message: "Credentials must be only alphanumeric, between 3 and 10 characters", fromsignup:'true' });
	    return;
	}
	var myRegxp = /\S+@\S+\.\S+/;
	if(myRegxp.test(req.body.signupemail) == false)
	{
	    res.render('index', { message: "Please insert a valid email adress", fromsignup:'true' });
	    return;
	}
	if (req.body.signuppassword!=req.body.signuppasswordconfirm) {
		res.render('index', {message: "The two passwords are not matching", fromsignup:'true' });
		return;
	}


	var users= db.model('User', schemas.userSchema);
	var out =users.findOne({ name: req.body.signupusername }, function (err, user) {
        if (user) {
		res.render('index', {message: "Username already taken", fromsignup:'true'  });
	} else {
		var newUser= new users({
		name: req.body.signupusername,
		password: req.body.signuppassword,
		email: req.body.signupemail
	}
	);
		newUser.save();
		res.render('registered', null);
	}
	});	

}





exports.checkusername=function(req,res) {
	User= db.model('User', schemas.userSchema);
	var response='0';
	var out =User.findOne({ name: req.params.username }, function (err, user) {
        if (user) {
		response='1';
	}
	res.send(200,response);
});
}

function loadJSON(filePath){
	var file = fs.readFileSync(filePath, 'utf8');
	return JSON.parse(file);
}

function preload(jsonFile) {
	var question = new Object({
		questionText:jsonFile.questionText,
		questionType: jsonFile.questionType,
		afterslide: jsonFile.afterslide,
		options: jsonFile.options
	});
	return question;
	

}



// exports.parsequestion=function(req,res) {
	// var questionDB= db.model('Question', schemas.questionSchema);
	// questionDB.findOne({},function(err,question) {
		// var optionDB= db.model('Option', schemas.optionSchema);
		// optionDB.find({ _id: { $in: question.answeroptions }}, function(err, options) {
			// if (err) throw err;
			// console.log(options)
			// res.render('questionTemplate',{questionObj: question, arrayoptions: options, mode:'admin'});
		// });
	// });
// 
// }

// exports.sendanswer=function(req,res) {
	// var questionDB= db.model('Question', schemas.questionSchema);
	// var optionDB= db.model('Option', schemas.optionSchema);
// 	
	// questionDB.findById("50cade3a56b9801502000009",function(err,question) {
		// optionDB.find({ _id: { $in: question.answeroptions }}, function(err, options) {
			// getQuestionStats("50cade3a56b9801502000009", function(err, stats) {
				// if (err) throw err;
				// res.render('answerTemplate-admin', {questionObj: question, arrayoptions: options} );
			// });
		// });	
	// });
// }


exports.sendstats=function(req,res) {

	var questionDB= db.model('Question', schemas.questionSchema);
	var optionDB= db.model('Option', schemas.optionSchema);
	console.log("###### Sendimg stats " + req.params.id)

	
	questionDB.findById(req.params.id, function(err,question) {
		optionDB.find({ _id: { $in: question.answeroptions }}, function(err, options) {
			if (err) throw err;
			
			getQuestionStats(req.params.id, function(err, stats) {
			
			var correct = [
		      ['Correct answers', 'Number of answers'],
		      ['Correct', stats.correct],
		      ['Wrong', stats.wrong]
			]
			
			var countedMcOptions = [
				[question.questionText, "Number of answers"]
			]
			for(ans in stats.equalAnswers){
				//console.log("###########");
				countedMcOptions.push( [options[ans].optionText, stats.countedMcOptions[ans]]);
			}
	
			var equalAnswers = [
				['Different answers', 'Number of answers']
			]
			for(ans in stats.equalAnswers){
				//console.log("###########");
				equalAnswers.push( [stats.equalAnswers[ans].ansContent.toString(), stats.equalAnswers[ans].count]);
			}

			//console.log(countedMcOptions);
			res.send(200,{correct: correct,countedMcOptions: countedMcOptions, equalAnswers:equalAnswers});

			});
		});	
	});

}

exports.getStats = function(questionId, callback) {
	var Question = db.model('Question', schemas.questionSchema);
	Question.findById(questionId).populate('answeroptions').exec(function(err, question){
		if (err) callback(err);
		getQuestionStats(questionId, function(err, stats) {
		
			
			if (err) callback(err);
			var correct = [
		      ['Correct answers', 'Number of answers'],
		      ['Correct', stats.correct],
		      ['Wrong', stats.wrong]
			]

			var countedMcOptions = [
				[question.questionText, "Number of answers"]
			]
			for(ans in stats.equalAnswers){
				console.log("###########");
				countedMcOptions.push( [question.answeroptions[ans].optionText, stats.countedMcOptions[ans]]);
			}

			var equalAnswers = [
				['Different answers', 'Number of answers']
			]
			for(ans in stats.equalAnswers){
				//console.log("###########");
				equalAnswers.push( [stats.equalAnswers[ans].ansContent.toString(), stats.equalAnswers[ans].count]);
			}
			callback(null, {correct: correct,countedMcOptions: countedMcOptions, equalAnswers:equalAnswers});
		});
	});
}

function getQuestionStats(questionId, callback){
	var answerDB= db.model('Answer', schemas.answerSchema);
	var questionDB= db.model('Question', schemas.questionSchema);
	var optionDB= db.model('Option', schemas.optionSchema);
	
	questionDB.findById(questionId, function(err,question) {
		answerDB.findOne({question: questionId},function(err,answer) {
			if (answer) {
				optionDB.find({ _id: { $in: question.answeroptions}}, function(err, answerOptions) {
					if (err) callback(err);
					
					console.log("#### Answers")	
					console.log(answer);
					console.log(answer.answers);
					console.log("--- Answers")
					var result = {
						total:answer.answers.length,
						correct: null,
						wrong: null,
						equalAnswers: null,
						countedMcOptions: null,
					}
				
					//Get array of correct answers
					var correctWrong = getCorrectAnswers(answer,answerOptions);
					result.correct = correctWrong[0];
					result.wrong = correctWrong[1];
					
					// Counting equal answers
					result.equalAnswers = getEqualAnswers(answer);
					
					// Counting selectet options for multiple choice
					result.countedMcOptions = getCountedMCOptions(answer,question); 
				
					console.log(result);
					callback(null, result);
	
				});	
			}
			
	});
});
}


function getNumberOfAnswers(questionId){
	answerDB.findOne({question: questionId},function(err,answer) {
		return answer.answers.length();
		
	});
}

function getCorrectAnswers(answer, answerOptions) {
	var correctAnswer = new Array();
	for (ans in answerOptions) {
		if (answerOptions[ans].correct == true) {
			correctAnswer.push(true);
		} else if (answerOptions[ans].correct == false) {
			correctAnswer.push(false);
		}else if (answerOptions[ans].correct !== undefined) {
			correctAnswer.push(answerOptions[ans].correct);
			console.log(typeof(answerOptions[ans].correct) +" "+answerOptions[ans].correct);
			
		} else {
			correctAnswer.push("false");
		}

	}
	//console.log("Correct ans " + correctAnswer);

	//Check for correct answers
	var correct = 0;
	var wrong = 0;
	for (var i = 0; i < answer.answers.length; i++) {
		console.log(answer.answers[i].content+" "+correctAnswer +" "+arrayEqual(answer.answers[i].content, correctAnswer))
		if (arrayEqual(answer.answers[i].content, correctAnswer)) {
			correct++;
		} else {
			wrong++;
		}
	}
	return [correct, wrong];
}


function getEqualAnswers(answer) {
	var equalAnswers = new Array();

	for (var i = 0; i < answer.answers.length; i++) {
		var newAnswer = true;

		//Chack all already grouped equal answers
		for (exAns in equalAnswers) {
			//Anwer already exists
			if (arrayEqual(answer.answers[i].content, equalAnswers[exAns].ansContent)) {
				equalAnswers[exAns].count++;
				newAnswer = false;
			}

		}
		if (newAnswer) {
			equalAnswers.push({
				ansContent : answer.answers[i].content,
				count : 1
			})
		}
	}
	return equalAnswers;
}



function getCountedMCOptions(answer, question) {
	var countetMcOptions = new Array();
	if (question.questionType == "Multiple choice") {
		//init array with 0
		for (var i = 0; i < answer.answers[0].content.length; i++) {
			countetMcOptions.push(0);
		}

		for (var j = 0; j < answer.answers.length; j++) {
			
			for (var k = 0; k < answer.answers[j].content.length; k++) {
				if (answer.answers[j].content[k] == true)
					countetMcOptions[k]++;
			}

		}
	}else{return null;}
	return countetMcOptions;
}



function arrayEqual(array1, array2){
	if(array1.length !== array2.length){
		console.log( "wrong length")
		return false;
	} else {
		for(var i = 0; i <array1.length; i++){
			if(array1[i] != array2[i]){
				console.log( typeof(array1[i]) + " - "+ typeof(array2[i]))
				return false;
			}
		}
	}
	return true;
}

exports.deletequestion=function(req,res) {
	
	var users= db.model('User', schemas.userSchema);
		var out =users.findById(req.user._id, function (err, user) {
		if (user) {
			var questionDB= db.model('Question', schemas.questionSchema);
			questionDB.remove({_id: req.query.quest}, function(err, question) {
				if (err) {
					console.log(err);
				}
			});
			var slideshowDB=db.model('Slideshow', schemas.slideshowSchema);
			slideshowDB.findById(req.query.id, function(err, slideshow) {
				for (var i=0;i<slideshow.questions.length;i++) {
					if (slideshow.questions[i]==req.query.quest) {
						slideshow.questions.splice( i, 1 );
						slideshow.save();
						
					}
				}
				
			});
			
			
		}
		res.redirect('/user/'+req.user.name + '/edit?id='+req.query.id);
		});

}

exports.addquestion=function(req,res) {
	
	var questionDB= db.model('Question', schemas.questionSchema);
	var newQuestion=new questionDB({
		questionText:req.body.questionText,
		questionType: req.body.questionType,
		afterslide: req.body.afterslide
		//answeroptions: optionsDB
	});
	//newQuestion.save();
	
	var optionDB=db.model('Option', schemas.optionSchema);
	for (var i=0; i<256; i++) {
		if (req.param('option'+i)) {
			var newOptionDB=new optionDB( {
				optionText: req.param('option'+i),
			});
			newOptionDB.correct = req.param('checkbox'+i) ? true : false;
			newOptionDB.save()
			newQuestion.answeroptions.push(newOptionDB._id);
			newQuestion.save();
			} else {
				if (i>0) {
					break;
				}
			}

	}
	
	var nquestion=0;
	var slideshowDB=db.model('Slideshow', schemas.slideshowSchema);
	slideshowDB.findById(req.query.id, function(err, slideshow) {
		if (err) {
			console.log(err);
		} else {
			if (slideshow) {
				nquestion=slideshow.questions.length;
				slideshow.questions.push(newQuestion._id);
				slideshow.save();
			}
			
		}
	}
		);
	
	// var answerDB = db.model('Answer', schemas.answerSchema);
	// var testanswer = [];
	// for(var i = 0; i<20; i++){
		// var testans = {content: ["true", "false", "false", "false"]};
		// testanswer.push(testans)
	// }
	// for(var i = 0; i<5; i++){
		// var testans = {content: ["false", "true", "false", "false"]};
		// testanswer.push(testans)
	// }
	// for(var i = 0; i<3; i++){
		// var testans = {content: ["false", "false", "true", "false"]};
		// testanswer.push(testans)
	// }
	// for(var i = 0; i<10; i++){
		// var testans = {content: ["false", "false", "false", "true"]};
		// testanswer.push(testans)
	// }
	// var newanswer = new answerDB({
		// //question: "50c7738315ed6e214a000009",
		// question: newQuestion._id,
		// answers : testanswer
	// }
	// );
	//newanswer.save();
	res.redirect('/user/'+req.user.name + '/edit?id='+req.query.id);
	
	
	
}

exports.editslideshow=function(req,res) {
	var users= db.model('User', schemas.userSchema);
	var out =users.findById(req.user._id, function (err, user) {
		if (err) {
			console.log(err);
		} else {
			if (user) {
		
				var slideshowbelongs=false;
				for (var i=0; i<user.slides.length;i++) {
					if (user.slides[i]==req.query.id) {
						slideshowbelongs=true;
						
					}
				}
				if (!slideshowbelongs) {
					res.redirect("/user");
				} else {
					var slideshowDB=db.model('Slideshow', schemas.slideshowSchema);
					slideshowDB.findById(req.query.id, function(err, slideshow) {
						if (err) {
							console.log(err);
						} else {
							if (slideshow) {
								
								var questions=[];
								var questionDB=db.model('Question', schemas.questionSchema);
								for (var i=0;i<slideshow.questions.length;i++) {
									questionDB.findById(slideshow.questions[i], function(err, question) {
										questions.push(question);
										if (questions.length==slideshow.questions.length) {
											res.render('edit', {arrayquestions: questions, username: req.user.name});
										}
									});
								}
								if (slideshow.questions.length==0) {
									res.render('edit', {arrayquestions: questions, username: req.user.name});
								}
								
							} else {
								res.redirect("/user");
							}
							
						}
					}
					);

				}
			
				
			}
		}
         
	});
		
	
	
}

exports.renderuser=function(req,res) {
	if (req.params.username==req.user.name) {
		var users= db.model('User', schemas.userSchema);
		var out =users.findById(req.user._id, function (err, user) {
		if (user) {
			slides=[];
			var slideshowDB=db.model('Slideshow', schemas.slideshowSchema);
			slideshowDB.find({ _id: { $in : user.slides } }, function(err, slides) {
				if (err) throw err;
				var type = req.query.type &&
						   /(succes|error|info)/g.test(req.query.type) ?
				           'alert-' + req.query.type : '';
				res.render('user', {arrayslides: slides, username: req.user.name, alert: req.query.alert, type:type, session: user.current});
			});
			
		} 
		});
    } else {
        res.redirect('/user/'+req.user.name + '/');
    }
}
