const numOfAnswers = 4;
function getListOfQuestions(questions){
    var finalQuestions = [];
    for (let q = 0;q<questions.length;q++) {
        let obj = questions[q];   
        let questionGenerated; 
        if (obj.question){
            questionGenerated = generateCompleteQuestion(obj.question,obj.data,numOfAnswers);
        }
        else {
            [questionGenerated,obj.groups] = generateTemplatedQuestion(
                obj.template,
                obj.groups,obj.selectedGroup,
                numOfAnswers);
        }
        finalQuestions.push(questionGenerated);
    }
    console.log(`Question generation finished successfully!\n
    Questions generated:`);
    console.log(finalQuestions);
    return finalQuestions;
};

function generateCompleteQuestion(text,data,n){
    if (n > data.length){
        return ;
    };
    var question = {
        text: "",
        options: [],
        crrAnswer: ""
    };
    question.text = text;
    question.options = [];
    question.crrAnswer = data.splice(0, 1)[0];
    question.options.push(question.crrAnswer);
    for (i = 1; i < n; i++) {
        if(data.length == 0) break;
        let randIndex = Math.floor(Math.random()*data.length);
        question.options.push(data.splice(randIndex, 1)[0]);
    };
    let randAnswer = Math.floor(Math.random()*question.options.length);
    question.options[0] = question.options.splice(randAnswer, 1, question.options[0])[0];
    return question;
}

function generateTemplatedQuestion(template,groups,selectedGroup,n){
    let foundIndex = groups.findIndex(element => element.groupName == selectedGroup);
    if(foundIndex == -1){
        console.log("group not found")
        return [,groups];
    }
    let totalQ = 0;
    groups.forEach(element => totalQ += element.data.length);
    if (n > totalQ){
        return [,];
    }
    let question = {
        text: "",
        options: [],
        crrAnswer: ""
    };

    var regex = /{.*}/;
    for (i = 0; i < n; i++) {
        if (groups[foundIndex].data.length == 0){
            groups.splice(foundIndex,1);
            foundIndex = 0;
        }
        if(groups.length == 0){
            return [,];
        }
        let randData = Math.floor(Math.random()*groups[foundIndex].data.length);
        let chosenData = groups[foundIndex].data[randData][1];
        while(question.options.includes(chosenData)){
            groups[foundIndex].data.splice(randData, 1);
            if(!groups[foundIndex].data.length){
                groups.splice(foundIndex,1);
                foundIndex = 0;
            }
            if(groups.length == 0){
                return [,];
            }
            randData = Math.floor(Math.random()*groups[foundIndex].data.length);
            chosenData = groups[foundIndex].data[randData][1];
        }
        question.options.push(groups[foundIndex].data[randData][1]);
        if(i == 0) {
            question.text = template.replace(regex, groups[foundIndex].data[randData][0]);
        }
        groups[foundIndex].data.splice(randData, 1);
    }
    var randAnswer = Math.floor(Math.random()*question.options.length);
    question.crrAnswer = question.options[0];
    question.options[0] = question.options.splice(randAnswer, 1, question.options[0])[0];
    return [question,groups];
}

function generateTemplatedQuestionOld(template,data,n){
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
        // console.log("adding option : " +data[randData][1]);
        question.options.push(data[randData][1]);
        if(i == 0) {
            question.text = template.replace(regex, data[randData][0]);
        }
        data.splice(randData, 1);
    }
    var randAnswer = Math.floor(Math.random()*question.options.length);
    question.crrAnswer = question.options[0];
    question.options[0] = question.options.splice(randAnswer, 1, question.options[0])[0];
    console.log("Question: \n"+question.text);
    console.log("\n Options: \n"+question.options);      
    console.log("\n Correct answer:  \n"+question.crrAnswer);
    return question;
}

module.exports.getListOfQuestions = getListOfQuestions;
