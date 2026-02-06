const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const papa = require('papaparse');
const _ = require('lodash');
const Zip = require("adm-zip");
const prompt = require('prompt-sync')({ sigint: true });

var wowPath = 'd:\\World of Warcraft\\_classic_\\';
var onePath = 'f:\\OneDrive\\wowBackup\\'

if (process.platform == 'darwin') {
    wowPath = '/Applications/World of Warcraft/_classic_/'
    onePath = '/Users/kaikai/OneDrive/wowBackup/'
}

var backupList = ['WTF', 'Interface', 'PARTICLES', 'SPELLS'];


async function readCSV(csv) {
    return new Promise((resolve, reject) => {
        papa.parse(csv, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function (result) {
                resolve(result.data);
            }
        });
    });
}

function readHistory() {
    return fs.readdirSync(onePath).filter(e => e.indexOf('log\.') >= 0).reverse();
}

async function readMD5(fullpath) {
    var zip = new Zip(fullpath);
    var logmd5 = zip.readAsText('md5.txt');
    var result = await readCSV(logmd5)
    if (process.platform == 'darwin') {
        for (let f of result) {
            f.rpath = f.rpath.split('\\').join('\/');
        }
    }
    if (process.platform == 'win32') {
        for (let f of result) {
            f.rpath = f.rpath.split('\/').join('\\');
        }
    }
    return result
}

function readZips() {
    var o = {};
    var ls = fs.readdirSync(onePath).filter(e => e.indexOf('pkg\.') >= 0);
    for (let f of ls) {
        var zip = new Zip(path.join(onePath, f));
        var entries = zip.getEntries();
        entries.forEach(e => {
            o[e.entryName] = zip;
        });
    }
    return o;
}

function delSync(dir) {
    if (!fs.existsSync(dir)) { return };
    var items = fs.readdirSync(dir);
    items.forEach(function (item) {
        var fullpath = path.join(dir, item);
        var s = fs.statSync(fullpath);
        if (s.isDirectory()) {
            delSync(fullpath);
        } else {
            fs.unlinkSync(fullpath);
        };
    });
};

async function restore(list, zips) {
    for (let f of list) {
        console.log(f.rpath);
        let tpath = path.join(wowPath, f.rpath);
        if (fs.existsSync(tpath)) {
            fs.unlinkSync(tpath);
        }
        var o = path.parse(tpath);
        zips[f.md5].extractEntryTo(f.md5, o.dir, false, true);
        fs.renameSync(path.join(o.dir, f.md5), tpath);
    }
}

(async () => {
    var archiveFiles = readHistory();
    for (let [i, a] of archiveFiles.entries()) {
        console.log(i + ':' + a);
    }
    var select = prompt('Input the order number: ');
    // var select = 0;
    while (!archiveFiles[select]) {
        select = prompt('Error, re-select: ');
    }
    console.log("You have selected: {" + archiveFiles[select] + '}.');
    console.log('Clearing Olds ...');
    backupList.forEach(p => {
        delSync(path.join(wowPath, p));
    });
    console.log('Loading Restore List ...');
    var restoreList = await readMD5(path.join(onePath, archiveFiles[select]));
    var store = await readZips();
    console.log('Start Restoring ..');
    await restore(restoreList, store);
})();


