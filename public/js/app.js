//App.js:  This file contains the code necessary for basic flow of our application

//Variable declarations for the high level screens of our single page app
var landingPageDiv = document.querySelector("#landingPage");
var studentEntryDiv = document.querySelector("#studentEntry");
var expertSignupDiv = document.querySelector("#expertSignup");
var videoPageDiv = document.querySelector("#videoPage");

//Variable declarations for other controls used on the signup pages and necessary for app flow
var studentName = document.querySelector("#studentName");
var expertName = document.querySelector("#expertName");
var expertSpecialty = document.querySelector("#expertSpecialty");
var enterAsStudent = document.querySelector("#enterAsStudent");
var requestExpert = document.querySelector("#requestExpert");
var requestExpertForm = document.querySelector("#requestExpertForm");
var waitingForExpert = document.querySelector("#waitingForExpert");
var waitingForExpertProgress = document.querySelector("#waitingForExpertProgress");
var expertSignupForm = document.querySelector("#expertSignupForm");
var expertSignupButton = document.querySelector("#expertSignupButton");
var waitingForStudent = document.querySelector("#waitingForStudent");
var expertListing = document.querySelector("#expertListing");
var callExpert = document.querySelector("#callExpert");
var enterAsExpert = document.querySelector("#enterAsExpert");

//Enter the application as a student and toggle the div's
enterAsStudent.addEventListener('click', function(ev){
	landingPageDiv.style.display = 'none';
	studentEntryDiv.style.display = 'block';
	expertSignupDiv.style.display = 'none';
	videoPageDiv.style.display = 'none';
	
	myUserType = "student";
	requestExpertForm.style.display = 'block';
	waitingForExpert.style.display = 'none';
	expertListing.style.display = 'none';
	ev.preventDefault();
}, false);

//For the student after they enter their basic information
//They will need to wait for a expert to arrive at this point
//Signaling code will trigger an update to this view once
//a expert has arrived
requestExpert.addEventListener('click', function(ev){
	requestExpertForm.style.display = 'none';
	waitingForExpert.style.display = 'block';
	expertListing.style.display = 'none';
	
	//The student joins the signaling room in socket.io
	studentUserName = studentName.value || 'no name';
	myName = studentUserName;
	io.emit('signal', {"user_type": "student", "user_name": studentUserName, "user_data": "no data, just a student", "command": "joinroom"});
	console.log("student " + studentUserName + " has joined.");
	
	ev.preventDefault();
}, false);

//Enter the application as a expert and progress to the sign up form
enterAsExpert.addEventListener('click', function(ev){
	landingPageDiv.style.display = 'none';
	studentEntryDiv.style.display = 'none';
	expertSignupDiv.style.display = 'block';
	videoPageDiv.style.display = 'none';
	
	myUserType = "expert";
	expertSignupForm.style.display = 'block';
	waitingForStudent.style.display = 'none';
	ev.preventDefault();
}, false);

//Allows the expert to "sign up" by entering their name and speciality
expertSignupButton.addEventListener('click', function(ev){
	expertSignupForm.style.display = 'none';
	waitingForStudent.style.display = 'block';
	
	//The expert joins the signaling room in socket.io
	expertUserName = expertName.value || 'no name';
	myName = expertUserName;
	io.emit('signal', {"user_type": "expert", "user_name": expertUserName, "user_data": expertSpecialty.value, "command": "joinroom"});
	console.log("Dr. " + expertUserName + " has joined.");
	
	ev.preventDefault();
}, false);

//Once a expert has arrived on the expert listing view,
//a student calls them from this button
callExpert.addEventListener('click', function(ev){
	landingPageDiv.style.display = 'none';
	studentEntryDiv.style.display = 'none';
	videoPageDiv.style.display = 'block';
	
	//Send a signal that the student is calling
	studentUserName = studentName.value || 'no name';
	io.emit('signal', {"user_type": "student", "user_name": studentUserName, "user_data": "calling expert", "command": "callexpert"});
	console.log("student " + studentUserName + " is calling.");
	
	//Kick off the WebRTC signaling
	//Setup the RTC Peer Connection object
	if (!rtcPeerConn) startSignaling();
	
	ev.preventDefault();
}, false);

