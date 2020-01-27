const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine('html', require('ejs').renderFile);

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
     * @param {string} imageRef
     */
    constructor(description, extension, fileName, argumentsDictionary, specialFunction, endFunction, imageRef) {
        this.description = description;
        this.extension = extension;
        this.fileName = fileName;
        this.argumentsDictionary = argumentsDictionary;
        this.specialFunction = specialFunction;
        this.endFunction = endFunction;
        this.imageRef = imageRef;
    }

}


const basicPages = [new basicPage("The home page.", "/", "home.ejs", null, null, null, "/images/web_learning/showcase/root.png"),
new basicPage("The main page of a fictional website for an anti-nuke advocacy group", "/nonukes", "nukes.html", null, null, null, "/images/web_learning/showcase/nonukes.png"),
new basicPage("The main page of a fictional website for buying votes", "/votebuy", "voter.html", null, null, null, "/images/web_learning/showcase/democracy.png"),
new basicPage("A tool to detect the language in the text you enter! I made it while learning about APIs. Check github for the backend code of everything, by the way.", "/languagedetector", "languageDetector.ejs", {lang : null, confidence: 0}, languageDetectorInit, langaugeDetectorEnd, "/images/web_learning/showcase/languagedetector.png"),
new basicPage("A fictional blog I made while learning CSS. Please don't take the content too seriously, it was written in 10 minutes for the laughs.", "/pasha", "pasha.html", null, null, null, "/images/web_learning/showcase/pasha.png"),
new basicPage("a list made just for your friends :)", "/friends", "friends.ejs", null , friendGetSpecial, null, "/images/web_learning/showcase/friends.png"),
new basicPage("Hi page, but it can say your name... if you enter it in the url.", "/hi/:name", "hiDynamic.ejs", { name: "" }, null, null, "/images/web_learning/showcase/hiperson.png"), //if left as empty string, the name of the key will be used within params
new basicPage("A form I made while learning HTML.", "/basicForm", "forms.html", null, null, null, "/images/web_learning/showcase/basicForm.png"),
new basicPage("static Hi page, but technically dynamic EJS file.", "/hi", "hi.ejs", null, null, null, "/images/web_learning/showcase/hi.png"),
new basicPage("a table for pokemons.", "/tablespokemon", "TablesPokemon.html", null, null, null, "/images/web_learning/showcase/pokemon.png"),
new basicPage("a website made for doge.", "/doge", "doggy.html", null, null, null, "/images/web_learning/showcase/doge.png"),
new basicPage("a list of some things I had learned up to that point.", "/thingslearned", "ThingsLearned.html", null, null, null, "/images/web_learning/showcase/thingsLearned.png"),
new basicPage("The first page.", "/first", "firstPage.html", null, null, null, "/images/web_learning/showcase/first.png")];

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
    basicPages[5].argumentsDictionary = { friends: friendsMap[req.ip] };
}

function languageDetectorInit(req, res) {
    basicPages[3].argumentsDictionary.lang = basicLanguageQueryAnswers.lang;
    basicPages[3].argumentsDictionary.confidence = basicLanguageQueryAnswers.confidence;
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
