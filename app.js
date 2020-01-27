const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

require("dotenv").config();

/* #region basic pages */

class basicPage {

    /**
     * 
     * @param {string} description 
     * @param {string} extension 
     * @param {string} fileName
     * @param {function} specialFunction
     * @param {function} endFunction
     */
    constructor(description, extension, fileName, argumentsDictionary, specialFunction, endFunction) {
        this.description = description;
        this.extension = extension;
        this.fileName = fileName;
        this.argumentsDictionary = argumentsDictionary;
        this.specialFunction = specialFunction;
        this.endFunction = endFunction;
    }

}


const basicPages = [new basicPage("The old home page.", "/oldhome", "oldHome.ejs"),
new basicPage("static Hi page.", "/hi", "hi.ejs"),
new basicPage("hi page, but it can say your name!", "/hi/:name", "hiDynamic.ejs", { name: "" }), //if left as empty string, the name of the key will be used within params
new basicPage("a list made just for your friends :)", "/friends", "friends.ejs", null , friendGetSpecial),
new basicPage("A tool to detect the language in the text you enter!", "/languagedetector", "languageDetector.ejs", {lang : null, confidence: 0}, languageDetectorInit, langaugeDetectorEnd)];

basicPages[0].argumentsDictionary = { basicPages: basicPages };

//info provided by some basic pages

// /friends
var friendsMap = [];
var maxNumberOfIpsHoldingFriends = 1000;

// /languagedetector and its API call limits
var basicLanguageQueryAnswers = {lang: null, confidence: 0}
var maxApiCalls;
var currentApiCalls;
var nextResetDate;

basicPages.forEach(function (page) {
    app.get(page.extension, (req, res) => {
        if (page.specialFunction != null) {
            page.specialFunction(req, res);
        }
        var dynamicParams = [];
        for (var key in page.argumentsDictionary) {
            if (page.argumentsDictionary[key] === "") {
                page.argumentsDictionary[key] = req.params[key];
                dynamicParams.push(key);
            }
        }
        res.render(page.fileName, page.argumentsDictionary);
        console.log("A get request to " + page.extension + " has been made!")
        for (var key in dynamicParams) {
            page.argumentsDictionary[dynamicParams[key]] = "";
        }
        if (page.endFunction != null) {
            page.endFunction(req, res);
        }
    });
})


/* #endregion */

/* #region basic posts */

app.post("/friends/addfriend", (req, res) => {
    var friendName = req.body.friendName;
    if (friendName != null) {
        console.log("A post request to friends/addfriend has been made with data " + friendName);
        if(!(req.ip in friendsMap)){
            friendsMap[req.ip] = [];
            if(friendsMap.length > maxNumberOfIpsHoldingFriends){
                //we have exceeded maximum number of ips holding friends!
                friendsMap.splice(0,1);
            }
        }
        friendsMap[req.ip].push(friendName);
    }
    res.redirect("/friends");
});


app.post("/languagedetector", (req, res) => {
    var text = req.body.text;
    var languageDetectorApiOptions = {
        method: 'POST',
        url: 'https://microsoft-azure-text-analytics-v1.p.rapidapi.com/languages',
        headers: {
          'x-rapidapi-host': 'microsoft-azure-text-analytics-v1.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPID_API_KEY,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: {
          documents: [{id: 'sentence1', text: text}]
        },
        json: true
      };
    

    var lang = "UNABLE TO GET LANGUAGE DUE TO API ISSUES, SORRY! WE MOST LIKELY RAN OUT OF THE FREEMIUM SUBSCRIPTION QUOTA. YOU CAN USE YOUR OWN API KEY BY RUNNING YOUR OWN VERSION OF THE SERVER AS FOUND ON GITHUB";
    var confidence = 0;
    if(currentApiCalls <= maxApiCalls){
        request(languageDetectorApiOptions, (error, response, body) => {

            if (error){
                console.log(error);
                res.redirect("/languagedetector");
            }else{
                lang = body.documents[0].detectedLanguages[0].name;
                confidence = body.documents[0].detectedLanguages[0].score;
                console.log(`An API call through a POST request on /languagedetector has been made with input "${text}" and output lang:${lang}, confidence:${confidence}` );
                basicLanguageQueryAnswers.lang = lang;
                basicLanguageQueryAnswers.confidence = confidence;
                currentApiCalls++;
                var resetDate = new Date(nextResetDate);
                resetDate.setMonth(resetDate.getMonth() - 1);
                fs.writeFile(".api_call_data", maxApiCalls.toString() + "\n" + currentApiCalls.toString() + "\n" + resetDate.toString(), (err) =>{
                    if(err){
                        console.log(err);
                        server.close();
                        process.exit();
                    }
                });
                res.redirect("/languagedetector");
            }
        });
    }else{
        console.log("RAN OUT OF MICROSOFT TEXT ANALYTICS API CALLS")
        basicLanguageQueryAnswers.lang = lang;
        basicLanguageQueryAnswers.confidence = confidence;
        res.redirect("/languagedetector");
    }
});

/* #endregion */

/* #region basic special functions */

function friendGetSpecial(req, res){
    if(!(req.ip in friendsMap)){
        friendsMap[req.ip] = [];
        if(friendsMap.length > maxNumberOfIpsHoldingFriends){
            //we have exceeded maximum number of ips holding friends!
            friendsMap.splice(0,1);
        }
    }
    basicPages[3].argumentsDictionary = { friends: friendsMap[req.ip] };
}

function languageDetectorInit(req, res) {
    basicPages[4].argumentsDictionary.lang = basicLanguageQueryAnswers.lang;
    basicPages[4].argumentsDictionary.confidence = basicLanguageQueryAnswers.confidence;
    console.log("yesu yesu yesu");
}

function langaugeDetectorEnd(req, res) {
    basicLanguageQueryAnswers.lang = null
    basicLanguageQueryAnswers.confidence = 0;
}

/* #endregion */
//cant risk API calls limits not being loaded. we are using this file because the course covers DB calls AFTER API calls.
fs.readFile(".api_call_data", (err, buf) =>{
    if(err){
        console.log(err)
        process.exit();
    }
    var output = (buf.toString());
    var res = output.split("\n");
    maxApiCalls = parseInt(res[0]);
    currentApiCalls = parseInt(res[1]);
    nextResetDate = new Date(res[2]);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    setInterval(() => {
        if(Date.now() > nextResetDate){
            nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            currentApiCalls = 0;
            var resetDate = new Date(nextResetDate);
                resetDate.setMonth(resetDate.getMonth() - 1);
                fs.writeFile(".api_call_data", maxApiCalls.toString() + "\n" + currentApiCalls.toString() + "\n" + resetDate.toString(), (err) =>{
                    if(err){
                        console.log(err);
                        server.close();
                        process.exit();
                    }
                });
        }
    }, 50000);
    console.log("The next API reset date is: " + nextResetDate.toString());
    console.log(`max Microsoft Text Analytics api calls: ${maxApiCalls}\ncurrent api calls: ${currentApiCalls}`);
    const server = app.listen(3000, function () {
        console.log("Server is listening on port 3000...");
    })
});
