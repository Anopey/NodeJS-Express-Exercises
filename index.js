var express = require("express");
var app = express();

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


var basicPages = [new basicPage("The home page.", "/", "home.ejs")];

basicPages[0].argumentsDictionary =  {basicPages : basicPages};

basicPages.forEach(function (page) {
    app.get(page.extension, function (req, res) {
        res.render(page.fileName, page.argumentsDictionary);
    });
})


/* #endregion */





app.listen(3000, function () {
    console.log("Server is listening on port 3000...");
})