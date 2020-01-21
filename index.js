var express = require("express");
var app = express();

app.use(express.static("public"))

/* #region basic pages */

class basicPage {

    /**
     * 
     * @param {string} description 
     * @param {string} extension 
     * @param {string} fileName
     */
    constructor(description, extension, fileName, argumentsDictionary) {
        this.description = description;
        this.extension = extension;
        this.fileName = fileName;
        this.argumentsDictionary = argumentsDictionary;
    }

}


var basicPages = [new basicPage("The home page.", "/", "home.ejs"),
new basicPage("static Hi page.", "/hi", "hi.ejs"),
new basicPage("hi page, but it can say your name!", "/hi/:name", "hiDynamic.ejs", {name : ""})]; //if left as empty string, the name of the key will be used within params

basicPages[0].argumentsDictionary =  {basicPages : basicPages};

basicPages.forEach(function (page) {
    app.get(page.extension, function (req, res) {
        var dynamicParams = [];
        for(var key in page.argumentsDictionary){
            if(page.argumentsDictionary[key] === ""){
                page.argumentsDictionary[key] = req.params[key];
                dynamicParams.push(key);
            }
        }
        res.render(page.fileName, page.argumentsDictionary);
        console.log("A get request to " + page.extension + " has been made!")
        for(var key in dynamicParams){
            page.argumentsDictionary[dynamicParams[key]] = ""; 
        }
    });
})


/* #endregion */





app.listen(3000, function () {
    console.log("Server is listening on port 3000...");
})