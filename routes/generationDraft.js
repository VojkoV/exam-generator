const PDFDocument = require('pdfkit');
const fs = require("fs");

const font = 16;
const instructions = " Please read all questions carefully and make sure you understand the facts before you begin answering. Write legibly and be as concise as possible." ;
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

function gemeratePDF(questions){
    console.log("\nNumber of questions "+questions.length);
    const nOfQ = questions.length;
    // for (e in questions){
    //     if(questions[e].template){
    //         console.log(questions[e].template+" is a template");
    //     }
    //     else console.log(questions[e].question+" is a question");
    // }
    var doc = new PDFDocument;
    var title = "Class_test_2019";
    doc.info.Title = title;
    doc.fontSize(font);
    doc.text(`${title}\n`);
    doc.fontSize(font);
    doc.text("\nName:__________________\n\n");
    doc.text(instructions+"\n");
    doc.pipe(fs.createWriteStream("/var/www/html/examgenerator/exams/"+title + '.pdf'));
    doc = writeQuestions(questions,doc);
    doc.end();
}

function generateCompleteQuestion(text,data,n){
    if (n > data.length){
        n = data.length;
    }
    let question = {
        text: "",
        options: [],
        crrAnswer: ""
    };
 
    question.text = text;
    question.options = [];
    question.crrAnswer = data.splice(0, 1)[0];
    question.options.push(question.crrAnswer);
    for (i = 1; i < n; i++) {
      let randIndex = Math.floor(Math.random()*data.length);
      question.options.push(data.splice(randIndex, 1)[0]);
    }
    let randAnswer = Math.floor(Math.random()*question.options.length);
    question.options[0] = question.options.splice(randAnswer, 1, question.options[0])[0];
    console.log("\n\n Question: \n"+question.text);
    console.log("\n Options: \n"+question.options);      
    console.log("\n Correct answer:  \n"+question.crrAnswer);
    return question;
}

function generateTemplatedQuestion(template,data,n){
    if (n > data.length){
        n = data.length;
    }
    let question = {
        text: "",
        options: [],
        crrAnswer: ""
      };

    var regex = /{.*}/; //gi;
    for (i = 0; i < n; i++) {
        let randData = Math.floor(Math.random()*data.length);
        question.options.push(data[randData][1]);
        if(i == 0) {
            question.text = template.replace(regex, data[randData][0]);
        }
        data.splice(randData, 1);
    }
    let randAnswer = Math.floor(Math.random()*question.options.length);
    question.crrAnswer = question.options[0];
    question.options[0] = question.options.splice(randAnswer, 1, question.options[0])[0];
    console.log("Question: \n"+question.text);
    console.log("\n Options: \n"+question.options);      
    console.log("\n Correct answer:  \n"+question.crrAnswer);
    return question;
}

function writeQuestions(questions,doc){
    const numOfAnswers = 4;
    if(questions.length == 0) {
        var questions = folder.questions;
        console.log("no questions selected\n")
    }
    for (var q = 0;q<questions.length;q++) {
        console.log(`\nwriting question ${q}...  `); 
        // var randQuestion = Math.floor(Math.random()*questions.length);
        // var obj = JSON.parse(questions[randQuestion]);
        var obj = questions[q];    
        // questions.splice(randQuestion,1);
        if (obj.question){
            var question = generateCompleteQuestion(obj.question,obj.data,numOfAnswers);
        }
        else{
            var question = generateTemplatedQuestion(obj.template,obj.data,numOfAnswers);
        }
        // Add text of the question
        doc.text(`\n\n${q+1}.  ${question.text}`);
        for (i = 0; i < question.options.length; i++) {
            // Add options for this question
            doc.text(`    ${alphabet[i]})  ${question.options[i]}`);
        }
    }
    console.log("Method finished successfully!");
    return doc;
};
module.exports.gemeratePDF = gemeratePDF;
