var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* #region basic pages */

class basicPage {

    /**
     * 
     * @param {string} description 
     * @param {string} extension 
     * @param {string} fileName
     * @param {function} specialFunction
     */
    constructor(description, extension, fileName, argumentsDictionary, specialFunction) {
        this.description = description;
        this.extension = extension;
        this.fileName = fileName;
        this.argumentsDictionary = argumentsDictionary;
        this.specialFunction = specialFunction;
    }

}


var basicPages = [new basicPage("The home page.", "/", "home.ejs"),
new basicPage("static Hi page.", "/hi", "hi.ejs"),
new basicPage("hi page, but it can say your name!", "/hi/:name", "hiDynamic.ejs", { name: "" }), //if left as empty string, the name of the key will be used within params
new basicPage("a list made just for your friends :)", "/friends", "friends.ejs")];

basicPages[0].argumentsDictionary = { basicPages: basicPages };

//info provided by some basic pages
var friendsMap = [];
var maxNumberOfIpsHoldingFriends = 1000;
basicPages[3].specialFunction = friendGetSpecial;

basicPages.forEach(function (page) {
    app.get(page.extension, function (req, res) {
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
    });
})


/* #endregion */

/* #region basic posts */

app.post("/friend/addfriend", function (req, res) {
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