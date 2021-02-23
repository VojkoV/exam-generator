var express = require('express');
var router = express.Router();
const User = require('../schemas/user');
const Folder = require('../schemas/folder');
// const ejs = require('ejs');
const QuestionGenerator = require('./generateWordExam.js');
const createReport = require('docx-templates').default;
// var docxConverter = require('docx-pdf');
// router.set(`view engine`,`ejs`);
const placeholderInfo = {
    placeholder: '.p.',
    placeholderRegex: /\.p\./g,
    serverSidePlaceholder: `{0}`
};
const placeholder = '.p.';
const placeholderRegex = /\.p\./g;
const serverSidePlaceholder = `{0}`;

// const fs = require('fs');
// const http = require('http');

// const axios = require('axios').default;
const Fs = require('fs')  
const Path = require('path')  
const Axios = require('axios')

async function downloadImage (url,directory,file) {
    return new Promise(async(resolve, reject) => { 
        const path = Path.resolve(directory, file)
        const writer = Fs.createWriteStream(path)
        const response = await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        let stream = response.data.pipe(writer);
        stream.on('finish', () => {return resolve(path)});
        stream.on('error', (error) => {console.log(error); return reject(error)});
    });
}

function getUserData(userId){
    return new Promise((resolve, reject) => {
        User.findById(userId, "-_id -password -__v").exec((error, user) => {
            if (error) reject(error)
            else {
                Folder.find({_id: user.folders}).exec((err, folders) => {
                    if(err) reject(err);
                    else {
                        var data = {
                            folders: folders,
                            username: user.username, 
                            email: user.email, 
                            user: user
                        }
                        data = Object.assign(data,placeholderInfo);
                        data.fNames = data.folders.map(folder => folder.name);
                        resolve(data);
                    }
                });    
            };
        });    
    });
};

router.post('/saveTemplate', requiresLogin, (req,res) => {
    var templateData = req.body.question;
    if(!templateData) return res.sendStatus(200);
    var template = templateData.shift().replace(placeholderRegex, serverSidePlaceholder);
    var dataPairs = [];
    while(templateData.length > 0) {
        dataPairs.push(templateData.splice(0,2));
    };
    var question = {
        template: template,
        data: dataPairs
    };
    question = JSON.stringify(question);
    if(req.body.folder_id){  
        console.log("saving to an existing folder: "+req.body.folder_id);
        Folder.findOneAndUpdate({ _id: req.body.folder_id},{ $push: { questions: question }},(err,folder)=>{
            if(err) {return console.log(err);}
            return res.sendStatus(200);
        });
    }
    else if(req.body.fName){
        console.log("saving to a new folder: "+req.body.fName);
        var folderData = {
            name: req.body.fName,
            questions: [question]
        }
        Folder.create(folderData,(err, folder) => {
            if(err) return console.log(err);
            else {
                User.findOneAndUpdate({ _id: req.session.userId},{ $push: { folders: folder._id }},(error,user)=>{
                    if(error) return console.log(error);
                    return res.sendStatus(200);
                });
            }
        });
    }
    else{
        console.log("sth went wrong");
        return res.sendStatus(500);
    }
});


var Api2Pdf = require('api2pdf');   
router.post('/generateExam', requiresLogin, async (req,res) => {
    let a2pClient = new Api2Pdf(`bb9a0ac6-8e57-4198-8b77-7565e6ec699c`);
    if(!req.body.questions){
        return res.sendStatus(500);
    }
    let title = req.body.examTitle;
    let docId= Date.now();
    let pdfPath = `/exams/Exam_${docId}.pdf`;
    let pdfAbsPath = __dirname+`/../examgenerator${pdfPath}`;
    let wordPath = `/exams/Exam_${docId}.docx`;
    let wordAbsPath = __dirname+`/../examgenerator${wordPath}`;
    let wordSolutionsPath = `/exams/ExamSolutions_${docId}.docx`;
    let wordSolutionsAbsPath = __dirname+`/../examgenerator${wordSolutionsPath}`;
    let questions = QuestionGenerator.getListOfQuestions(req.body.questions);
    var paths = {};
    let makeSolutions = req.body.solutions;
    if(makeSolutions == "true"){
        console.log("solution requested")
        await createReport({
            template: __dirname+"/../templates/solutionsTemplate.docx",
            output: wordSolutionsAbsPath,
            data: {
                name: title,
                questionList: questions
            }
        })
        .then(()=>{
            console.log("solutions completed")
            paths.solutions = wordSolutionsPath;
        })
        .catch((err) => {
            return res.send(err);
        });
    }
    else console.log("solution not requested");

    await createReport({
        template: __dirname+"/../templates/working.docx",
        output: wordAbsPath,
        data: {
            name: title,
            questionList: questions
        }
    })
    .catch((err) => {
        return res.send(err);
    });
    console.log("finished docx generation");

    if(req.body.fileExtension == "pdf"){
        console.log("pdf working")
        var pdfUrl;
        var dir = __dirname+"/../examgenerator/exams";
        var file = `Exam_${docId}.pdf`;
        await a2pClient.libreofficeConvert(`http://localhost:3000/${wordPath}`)
        .then(async(result) => {
            pdfUrl = result.pdf;
        });

        await downloadImage(pdfUrl,dir,file).then(() => {
            paths.pdf = pdfPath;
            return res.send(paths); 
        })
        .catch(err=>{
            return res.send(err);
        });
    }
    else{
        paths.docx = wordPath;
        return res.send(paths);
    }
});

router.post('/saveQuestion', requiresLogin, (req,res) => {
    console.log("req.body:");
    console.log(req.body);
    var questionData = req.body.question;
    // var template = templateData.shift();
    console.log("questionData:")
    console.log(questionData);
    if(!questionData) return res.sendStatus(404);
    if(questionData.length < 4) return res.sendStatus(404);
    questionText = questionData.shift();
    var questionData = {
        question: questionText,
        data: questionData
    };
    questionData = JSON.stringify(questionData);
    console.log("questionData")
    console.log(questionData)
    
    if(req.body.folder_id){  
        console.log("saving to an existing folder: "+req.body.folder_id);
        Folder.findOneAndUpdate({ _id: req.body.folder_id},{ $push: { questions: questionData }},(err,folder)=>{
            if(err) {return console.log(err);}
            console.log("claaback");
            console.log(folder);
            return res.sendStatus(200);
        });
    }
    else if(req.body.fName){
        console.log("saving to a new folder: "+req.body.fName);
        var folderData = {
            name: req.body.fName,
            questions: [questionData]
        }
        Folder.create(folderData,(err, folder) => {
            console.log("we are in d callback");
            if(err) return console.log(err);
            else {
                User.findOneAndUpdate({ _id: req.session.userId},{ $push: { folders: folder._id }},(error,user)=>{
                    if(error) return console.log(error);
                    console.log("claaback");
                    console.log(user);
                    console.log("new folder");
                    console.log(folder);
                    return res.sendStatus(200);
                });
            }
        });
    }
    else{
        console.log("sth went wrong");
        return res.sendStatus(500);
    }
    // return res.sendStatus(200);
});

router.get('/newExam', requiresLogin, (req, res) => {
    getUserData(req.session.userId).then(data => {
        return res.render(__dirname+"/../examgenerator/newExam.ejs",data);
    });
});

router.get('/newQuestion', requiresLogin, (req, res) => {
    getUserData(req.session.userId).then(data => {
        return res.render(__dirname+"/../examgenerator/newQuestion.ejs",data);
    });
});

router.get('/newTemplate', requiresLogin, (req, res) => {
    getUserData(req.session.userId).then(data => {
        return res.render(__dirname+"/../examgenerator/newTemplate.ejs",data);
    });
});

router.get('/newNewTemplate', requiresLogin, (req, res) => {
    getUserData(req.session.userId).then(data => {
        return res.render(__dirname+"/../examgenerator/newNewTemplate.ejs",data);
    });
});

router.post('/saveNewTemplate', requiresLogin, (req,res) => {
    var templateData = req.body.question;
    if(!templateData) return res.sendStatus(400);
    var template = templateData.shift().replace(placeholderRegex, serverSidePlaceholder);
    let groups = [];
    let groupNames = [];
    while(templateData.length > 0) {
        let groupName = templateData.splice(2,1)[0];
        let index = groupNames.indexOf(groupName)
        if(index > -1){ groups[index].data.push(templateData.splice(0,2)); }
        else{
            groupNames.push(groupName);
            var newGroup = {
                groupName: groupName,
                data: [templateData.splice(0,2)]
            }
            groups.push(newGroup);
        }
    };
    let question = {
        template: template,
        groups: groups
    };
    question = JSON.stringify(question);
    if(req.body.folder_id){  
        console.log("saving to an existing folder: "+req.body.folder_id);
        Folder.findOneAndUpdate({ _id: req.body.folder_id},
            { $push: { questions: question }},(err)=>{
            if(err) {return res.sendStatus(200)}
        });
    }
    else if(req.body.fName){
        console.log("saving to a new folder: "+req.body.fName);
        var folderData = {
            name: req.body.fName,
            questions: [question]
        }
        Folder.create(folderData,(err, folder) => {
            if(err) return console.log(err);
            else {
                User.findOneAndUpdate({ _id: req.session.userId},
                    { $push: { folders: folder._id }},(error)=>{
                    if(error) return console.log(error);
                });
            }
        });
    }
    else{
        console.log("something went wrong");
        return res.sendStatus(500);
    }
    return res.sendStatus(200);
});

router.get('/profile', requiresLogin, (req, res) => {
    getUserData(req.session.userId).then(data => {
        return res.render(__dirname+"/../examgenerator/profile.ejs",data);
    });
});

router.post('/createFolder', requiresLogin, (req,res) => {
    var fName = req.body.fName;
    if(!fName) return res.sendStatus(500);
    Folder.create({name: req.body.fName},(err, folder) => {
        if(err) return console.log(err);
        else {
            User.findOneAndUpdate({ _id: req.session.userId},{ $push: { folders: folder._id }},(error,user)=>{
                if(error) {
                    console.log(error);
                    return res.sendStatus(500);
                }
                return res.sendStatus(200);
            });
        }
    });
});

router.post('/deleteFolder', requiresLogin, (req,res) => {
    var folder_id = req.body.folder_id;
    if(!folder_id) return res.sendStatus(500);
    User.updateOne( { _id: req.session.userId }, { $pullAll: {folders: [folder_id]} } ,(error,user)=>{
        if(error) return console.log(error);
        Folder.findOneAndDelete({ _id: folder_id},(err,folder)=>{
            if(err) {return console.log(err);}
            return res.sendStatus(200);
        });
    });
});

router.get('/', (req, res) => {
    console.log(__dirname);
    if (req.session.userId) {
        getUserData(req.session.userId).then(data => { 
            return res.sendFile(__dirname+'/../examgenerator/indexLogged.html');
        });
    }
    else {
        return res.sendFile(__dirname+'/../examgenerator/index.html');
    }
});


router.post('/login', requiresLoggedOut, (req,res,next) => {
    if (req.body.email && req.body.password) {
        User.authenticate(req.body.email, req.body.password, (error, user)=>{
        if (error || !user) {
            var err = new Error('Wrong email or password.');
            err.status = 401;
            return res.send("wrong credentials");
        } else {
            req.session.userId = user._id;
            return res.send("logged");
        }
        });
    } 
    else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
    }
});

const num = /[0-9]/;
const capLetter = /[A-Z]/;
const lowLetter = /[a-z]/;
router.post('/register', requiresLoggedOut, (req, res, next) => {
    if (req.body.password.length < 8 || !num.test(req.body.password) || !capLetter.test(req.body.password) || !lowLetter.test(req.body.password)) {
        return res.status(401).send("invalid password"); 
    }
    // confirm that user typed same password twice
    if (req.body.password !== req.body.passwordConf) {
        var err = new Error('Passwords do not match.');
        err.status = 400;
        // return res.send("passwords dont match");
        return res.status(401).send("mismatching passwords");
        // return next(err);
    }
    if (req.body.email &&
        req.body.username &&
        req.body.password &&
        req.body.passwordConf) {
        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password
        }
        User.exists(req.body.email, (err,inUse) => {
            if(err){
                return res.sendStatus(500);
            }
            else if(inUse){return res.send("inUse");}
            else{
                User.create(userData,(error, user) => {
                    if (error) {
                        return res.send(error);
                    } else {
                        req.session.userId = user._id;
                        return res.send("registered");
                    }
                });
            };
        });
    } 
    else {
        return res.status(400).send("missing fields");
    }
})

// GET for logout logout
router.get('/logout', (req, res, next) => {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
        if (err) return next(err);
        else return res.redirect('/');
        });
    }
});

function requiresLoggedOut(req, res, next) {
    if (req.session && req.session.userId) { return res.redirect('/'); } 
    else { return next(); }
};

function requiresLogin(req, res, next) {
    if (req.session && req.session.userId) { return next(); } 
    else { return res.redirect('/'); }
};
module.exports = router;