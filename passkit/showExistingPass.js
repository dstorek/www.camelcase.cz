//getLatestPass.js
'use strict';

var
    Passbook = require('../models/passbook'),
    Blueprint = require('../models/blueprint'),
    fs      = require('fs'),
    execFile    = require('child_process').execFile,
    crypto  = require('crypto'),
    JSZip = require('jszip')
    ;

var showExistingPass = function(userEmail) {

        var jsonResponse = {
          "passTypeIdentifier" : "nenalezen",
          "value" : "--",
          "currencyCode" : "--"
        };

        if (!userEmail)  {
            res.send(404);
            return;
        }

        Passbook.findOne({ 'email' : passTypeIdentifier }, function(err, doc) {
            if (err) {
                throw err;            }
            if (!doc) {
                //
                console.log("not doc");
            }
            else {
                var passTypeIdentifier = doc.pass.passTypeIdentifier;
                var serialNumber = doc.pass.serialNumber;

                findPassData(passTypeIdentifier, serialNumber, function(err, data){

                    if (!err) {
                         console.log("Data jsou:");
                         console.log(data);
                        console.log("----------");
                    }
                });

            }
        });
};

// ---------- begin utility methods ---------------------
function findPassData(passTypeIdentifier, serialNumber, callback) {

    Passbook.findOne({ 'pass.passTypeIdentifier' : passTypeIdentifier, 'pass.serialNumber' : serialNumber,
        'pass.authenticationToken' : authorization }, function(err, doc) {

        if (err) {
            console.log("findPassData() err branch");
            throw err;
            // callback(new Error(stderr));
        }

        if (!doc) {
            console.log("findPassData() !doc branch");
            // callback(new Error(stderr));
        }

        if (doc && !err) {
            var passData = {
                "value" : "empty",
                "currencyCode" : "empty"
            };

            if (doc.pass.storeCard.primaryFields[0].value && doc.pass.storeCard.primaryFields[0].currencyCode) {
                passData.value = doc.pass.storeCard.primaryFields[0].value; // "value" field contains balance
                passData.currencyCode = doc.pass.storeCard.primaryFields[0].currencyCode;
            }
            callback(null, passData)
        }
    });

    var sign = execFile("openssl", args, {stdio: "pipe"}, function (error, stdout, stderr) {
        if (error || stderr.trim()) {
            // callback(new Error(stderr));
            // console.log(error);
            console.log("error when signing the manifest file");
        } else {
            var signature = stdout.split(/\n\n/)[3];
            callback(null, new Buffer(signature, "base64")); // does not work well ?
        }
    });
    sign.stdin.write(myBuffer7);
    sign.stdin.end();
}
// ----------- end utility methods ----------

module.exports = {showExistingPass : showExistingPass};