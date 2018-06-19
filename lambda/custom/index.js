'use strict';
var Alexa = require("alexa-sdk");
var http = require('http');
var https = require('https');
var config = require('./config.js')

const UNKNOWN_ERROR = "unknown error";
const YEAR_ERROR = "invalid year";
const COUNT_SUBJECTS = [
    'active expense contracts',
    'active subcontracts',
    'subcontracts canceled',
    'subcontracts approved',
    'subcontracts rejected',
    'subcontracts submitted',
    'subcontracts under review'
];
const AMOUNT_SUBJECTS = [
    'total payroll',
    'total budget',
    'total spending',
    'total revenue'
];

exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('SayWelcome');
    },
    'FallbackIntent': function () {
        this.emit('SayWelcome');
    },

    'CountQuestionIntent': function () {
        this.emit('DoCountQuestion');
    },
    'CountQuestionPromptIntent': function () {
        var dialogState = this.event.request.dialogState;
        if (dialogState == "STARTED" || dialogState == "IN_PROGRESS") {
            this.emit(":delegate");
        }

        var year_type = this.event.request.intent.slots.year_type.value;
        if (year_type === 'calendar year') {
            this.emit('DoCountQuestionCalendar');
        }else{
            this.emit('DoCountQuestionFiscal');
        }
    },
    'CountQuestionFiscalIntent': function () {
        this.emit('DoCountQuestionFiscal');
    },
    'CountQuestionCalendarIntent': function () {
        this.emit('DoCountQuestionCalendar');
    },


    'AmountQuestionIntent': function () {
        this.emit('DoAmountQuestionCalendar');
    },
    'AmountQuestionPromptIntent': function () {
        var dialogState = this.event.request.dialogState;
        if (dialogState == "STARTED" || dialogState == "IN_PROGRESS") {
            this.emit(":delegate");
        }

        var year_type = this.event.request.intent.slots.year_type.value;
        if (year_type === 'fiscal year') {
            this.emit('DoAmountQuestionFiscal');
        }else{
            this.emit('DoAmountQuestionCalendar');
        }
    },
    'AmountQuestionFiscalIntent': function () {
        this.emit('DoAmountQuestionFiscal');
    },
    'AmountQuestionCalendarIntent': function () {
        this.emit('DoAmountQuestionCalendar');
    },

    'DoCountQuestionFiscal': function () {
        handlers.DoCountQuestion(this, 'fiscal');
    },
    'DoCountQuestionCalendar': function () {
        handlers.DoCountQuestion(this, 'calendar');
    },
    'DoCountQuestion': function (handler, year_type = 'fiscal') {
        if (!handler) {
            handler = this;
        }
        console.log("THIS.EVENT = " + JSON.stringify(handler.event));

        var from_promot_intent = !!handler.event.request.intent.slots.count_prompt_subject;
        var subject_obj = from_promot_intent?handler.event.request.intent.slots.count_prompt_subject:handler.event.request.intent.slots.count_subject;

        var subject;
        if (subject_obj.resolutions && subject_obj.resolutions.resolutionsPerAuthority[0].status.code ==="ER_SUCCESS_MATCH") {
            subject = subject_obj.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        }

        var year = from_promot_intent?handler.event.request.intent.slots.count_prompt_year.value:handler.event.request.intent.slots.count_year.value;

        if (!year || year === '?' || !subject || subject === '?') {
            handler.emit('SayWrongQuestion');
        }else if ( parseInt(year, 10) < 1000){
            handler.emit(':tell', "I heard year " + parseInt(year, 10) + ". That is not a valid year.");
        }else if(!InArray(COUNT_SUBJECTS, subject.toLowerCase())){
            console.log("wrong subject = " + subject.toLowerCase());
            handler.emit('SayWrongQuestion');
        }else{
            ApiCallHttp(subject, year, year_type, (data) => {
                var has_error = ApiHasError(data);
                if (has_error) {
                    if (has_error === YEAR_ERROR) {
                        handler.emit(':tell', "I have no data for year " + parseInt(year, 10) );
                    }else{
                        handler.emit('SayUnknownError');
                    }
                }
                handler.response.speak('For ' + year_type + ' year ' + year + ', the count of ' + CorrectSaying(subject) + ' of New York City is ' + data.data);
                handler.emit(':responseReady');
            });
        }
    },


    'DoAmountQuestionFiscal': function () {
        handlers.DoAmountQuestion(this, 'fiscal');
    },
    'DoAmountQuestionCalendar': function () {
        handlers.DoAmountQuestion(this, 'calendar');
    },
    'DoAmountQuestion': function (handler, year_type = 'fiscal') {
        if (!handler) {
            handler = this;
        }
        console.log("THIS.EVENT = " + JSON.stringify(handler.event));

        var from_promot_intent = !!handler.event.request.intent.slots.amount_prompt_subject;
        var subject_obj = from_promot_intent?handler.event.request.intent.slots.amount_prompt_subject:handler.event.request.intent.slots.amount_subject;

        var subject;
        if (subject_obj.resolutions && subject_obj.resolutions.resolutionsPerAuthority[0].status.code ==="ER_SUCCESS_MATCH") {
            subject = subject_obj.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        }

        var year = from_promot_intent?handler.event.request.intent.slots.amount_prompt_year.value:handler.event.request.intent.slots.amount_year.value;
        if (!year || year === '?' || !subject || subject === '?') {
            handler.emit('SayWrongQuestion');
        }else if ( parseInt(year, 10) < 1000){
            handler.emit(':tell', "I heard year " + parseInt(year, 10) + ". That is not a valid year.");
        }else if (!InArray(AMOUNT_SUBJECTS, subject.toLowerCase())){
            console.log("wrong subject = " + subject.toLowerCase());
            handler.emit('SayWrongQuestion');
        }else{
            ApiCallHttp(subject, year, year_type, (data) => {
                var has_error = ApiHasError(data);
                if (has_error) {
                    if (has_error === YEAR_ERROR) {
                        handler.emit(':tell', "I have no data for year " + parseInt(year, 10) );
                    }else{
                        handler.emit('SayUnknownError');
                    }
                }
                handler.response.speak('For ' + year_type + ' year ' + year + ', the amount for ' + CorrectSaying(subject) + ' of New York City is ' + data.data);
                handler.emit(':responseReady');
            });
        }
    },


    'SayWelcome': function () {
        this.emit(':ask', "Welcome to New York Checkbook voice assistant. You can ask about New York City budget, revenue, spending, contracts and payrolls.");
    },
    'SayWrongQuestion': function () {
        this.response.speak('I am not sure I have an answer to that question.');
        this.emit(':responseReady');
    },
    'SayDontKnow': function () {
        this.emit(':tell', "I haven't been trained to respond to that request.");
    },
    'SayUnknownError': function () {
        this.response.speak('Sorry, there was a problem. Try that question later.');
        this.emit(':responseReady');
    },

    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("You can try: 'alexa, ask check book how many active sub contracts in year 2018'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        //log the event sent by the Alexa Service in human readable format
        console.log(JSON.stringify(this.event));
        let skillId, requestType, dialogState, intent ,intentName, intentConfirmationStatus, slotArray, slots, count;

        try {
            //Parse necessary data from JSON object using dot notation
            //build output strings and check for undefined
            skillId = this.event.session.application.applicationId;
            requestType = "This is an Unhandled request. The request type is, "+this.event.request.type+" .";
            dialogState = this.event.request.dialogState;
            intent = this.event.request.intent;
            if (intent != undefined) {
                intentName = " The intent name is, "+this.event.request.intent.name+" .";
                slotArray = this.event.request.intent.slots;
                intentConfirmationStatus = this.event.request.intent.confirmationStatus;

                if (intentConfirmationStatus != "NONE" && intentConfirmationStatus != undefined ) {
                    intentConfirmationStatus = " and its confirmation status is "+ intentConfirmationStatus+" . ";
                    intentName = intentName+intentConfirmationStatus;
                }
            } else {
                intentName = "";
                slotArray = "";
            }

            slots = "";
            count = 0;

            if (slotArray == undefined || slots == undefined) {
                slots = "";
            }

            //Iterating through slot array
            for (let slot in slotArray) {
                count += 1;
                let slotName = slotArray[slot].name;
                let slotValue = slotArray[slot].value;
                let slotConfirmationStatus = slotArray[slot].confirmationStatus;
                slots = slots + "The <say-as interpret-as='ordinal'>"+count+"</say-as> slot is, " + slotName + ", its value is, " +slotValue;

                if (slotConfirmationStatus!= undefined && slotConfirmationStatus != "NONE") {
                  slots = slots+" and its confirmation status is "+slotConfirmationStatus+" . ";
                } else {
                  slots = slots+" . ";
                }
            }

            //Delegate to Dialog Manager when needed
            //<reference to docs>
            if (dialogState == "STARTED" || dialogState == "IN_PROGRESS") {
              this.emit(":delegate");
            }
        } catch(err) {
            console.log("Error: " + err.message);
        }

        let speechOutput = "Your end point receive a request, here's a breakdown. " + requestType + " " + intentName + slots;
        let cardTitle = "Skill ID: " + skillId;
        let cardContent = speechOutput;

        this.response.cardRenderer(cardTitle, cardContent);
        this.response.speak(speechOutput);
        this.emit(':responseReady');
      }
};



function ApiCallHttp(subject, year, year_type, callback) {
    var api_path = subject.replace(/ /g, '_');

    var options = {
        host: config.host,
        auth: config.auth,
        port: config.port,
        path: config.path.replace("[API_PATH]", api_path).replace("[YEAR]", year).replace("[YEAR_TYPE]", year_type),
        method: 'GET'
    };
    var protocol = (config.protocol==='https')?https:http;

    var req = protocol.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var result = JSON.parse(returnData);
            callback(result);
        });
    });
    req.end();
}

function ApiHasError(data) {
    if (data.success) {
        return null;
    }else if (data.message){
        return data.message;
    }else{
        return UNKNOWN_ERROR;
    }
}

function InArray(arr, elem) {
    return (arr.indexOf(elem) != -1);
}

function CorrectSaying(subject) {
    // correct alexa's speaking of some terms
    if (subject === 'active subcontracts') {
        return 'active sub contracts';
    }else if (subject === 'subcontracts canceled'){
        return 'canceled sub contracts';
    }else if (subject === 'subcontracts approved'){
        return 'approved sub contracts';
    }else if (subject === 'subcontracts rejected'){
        return 'rejected sub contracts';
    }else if (subject === 'subcontracts submitted'){
        return 'submitted sub contracts';
    }else if (subject === 'subcontracts under review'){
        return 'sub contracts under review';
    }

    return subject;
}