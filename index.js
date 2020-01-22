const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
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


var basicPages = [new basicPage("The home page.", "/", "home.ejs"),
new basicPage("static Hi page.", "/hi", "hi.ejs"),
new basicPage("hi page, but it can say your name!", "/hi/:name", "hiDynamic.ejs", { name: "" }), //if left as empty string, the name of the key will be used within params
new basicPage("a list made just for your friends :)", "/friends", "friends.ejs", null , friendGetSpecial),
new basicPage("A tool to detect the language in the text you enter!", "/languagedetector", "languageDetector.ejs", {lang : null})];

basicPages[0].argumentsDictionary = { basicPages: basicPages };

//info provided by some basic pages
var friendsMap = [];
var maxNumberOfIpsHoldingFriends = 1000;


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

app.post("/friend/addfriend", (req, res) => {
    var friendName = req.body.friendName;
    if (friendName != null) {
        console.log("A post request to friend/addfriend has been made with data " + friendName);
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


app.post("/languageDetector", (req, res) => {
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
    
    request(languageDetectorApiOptions, (error, response, body) => {
        if (error) throw new Error(error);
    
        console.log(body);
    });
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

/* #endregion */



app.listen(3000, function () {
    console.log("Server is listening on port 3000...");
})