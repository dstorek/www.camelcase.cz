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

var createPass = function(req, res){

    // var passTypeIdentifier = "pass.cz.camelcase.node";

    var serialNumber        = 10000 * Date.now() + Math.floor( Math.random() * 10000);
    var barcodeMessage      = 10000 * Date.now() + Math.floor( Math.random() * 10000);

    var shasum              = crypto.createHash('sha1');

    var authenticationToken = 10000 * Date.now() + Math.floor( Math.random() * 10000);
    shasum.update(authenticationToken.toString());
    authenticationToken     = shasum.digest('hex');

    var lastUpdated         = new Date().toJSON();      // ISO8601 formatted timestamp
    var lastUpdatedTimestamp  = Date.now();             //  timestamp in ms from 1970

    var email = "dstorek@post.cz";

    // var jsonFile            = workFolder + '/pass.json';

    // creates and saves a new Passbook in the database
    var newPassbook                      = new Passbook;
    // set the Passbooks credentials
    newPassbook.pass.serialNumber        = serialNumber.toString();
    newPassbook.pass.barcode.message     = barcodeMessage.toString();
    newPassbook.pass.authenticationToken = authenticationToken;
    newPassbook.email                    = email;
    newPassbook.lastUpdated              = lastUpdated;
    newPassbook.lastUpdatedTimestamp     = lastUpdatedTimestamp;
    // save the Passbook
    newPassbook.save(function(err) {
        if (err) {
            res.send(404);
            throw err;
        }
    });

    // console.log("typeof Passbook");
    // console.log(typeof(newPassbook));
    // console.log(newPassbook);

    findPNGfiles(newPassbook.pass); // pass.json

    function findPNGfiles(document) {
        Blueprint.find({"passTypeIdentifier": "pass.cz.camelcase.loyalty"}, function (err, docs) {
            if (err) {
                res.send(404); // TODO what happens when db with files is not ready?
                throw err;
            }
            // console.log(docs);
            computeHash(docs[0], document);
        });
    }

    function computeHash(myPass, passJSON ) {
        var myBuffer = new Buffer(JSON.stringify(passJSON, null, 4));
        var myBuffer2 = new Buffer(myPass.icon);
        var myBuffer3 = new Buffer(myPass.icon2x);
        var myBuffer4 = new Buffer(myPass.logo);
        var myBuffer5 = new Buffer(myPass.strip);
        var myBuffer6 = new Buffer(myPass.strip2x);

        var shasums = {};
        var shasum = crypto.createHash('sha1');

        shasum.update(myBuffer);
        shasums.pass = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(myBuffer2);
        shasums.icon = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(myBuffer3);
        shasums.icon2x = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(myBuffer4);
        shasums.logo = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(myBuffer5);
        shasums.strip = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(myBuffer6);
        shasums.strip2x = shasum.digest('hex');

        var manifest = {
            "pass.json": shasums.pass,
            "icon.png": shasums.icon,
            "icon@2x.png": shasums.icon2x,
            "logo.png": shasums.logo,
            "strip.png": shasums.strip,
            "strip@2x.png": shasums.strip2x
        };

        var myBuffer7 = new Buffer(JSON.stringify(manifest, null, 4));

        zipFunction(myBuffer, myBuffer2, myBuffer3, myBuffer4, myBuffer5, myBuffer6, myBuffer7);
    }

    function zipFunction (myBuffer, myBuffer2, myBuffer3, myBuffer4, myBuffer5, myBuffer6, myBuffer7) {

        signManifest(myBuffer7, function(error, signature){
            if (!error){

                var zip = new JSZip();

                zip.file('signature', signature);
                zip.file("pass.json", myBuffer);
                zip.file("icon.png", myBuffer2);
                zip.file("icon@2x.png", myBuffer3);
                zip.file("logo.png", myBuffer4);
                zip.file("strip.png", myBuffer5);
                zip.file("strip@2x.png", myBuffer6);
                zip.file("manifest.json", myBuffer7);

                var contentBuffer = zip.generate({type:"nodebuffer"});
                /*
                 fs.writeFile("/data/pass.pkpass", contentBuffer, function(err) {
                 if (err) throw err;
                 });
                 */
                // var willSendThisPass = zip.toBuffer();
                // dumpToBrowser(willSendThisPass);

                dumpToBrowser(contentBuffer);
            }
        });
    }

    function dumpToBrowser(willSendThisPass) {

        res.setHeader('Content-disposition', 'attachment; filename=myPass.pkpass');
        res.contentType('application/vnd.apple.pkpass');
        res.write(willSendThisPass);
        res.end();
    }
};

// ---------- begin utility methods ---------------------
function signManifest(myBuffer7, callback) {

    var args = [
        "smime",
        "-sign", "-binary",
        "-signer", "./certificates/pass_cert_loyalty.pem",
        "-inkey", "./certificates/pass_key_loyalty.pem",
        "-certfile", "./certificates/WWDR.pem",
        "-passin", "pass:123456"
    ];

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

module.exports = {createPass : createPass};