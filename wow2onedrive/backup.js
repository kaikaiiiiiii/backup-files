const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const papa = require('papaparse');
const _ = require('lodash');
const Zip = require("adm-zip");


var wowPath = 'd:\\World of Warcraft\\_classic_\\';
var onePath = 'f:\\OneDrive\\wowBackup\\'

if (process.platform == 'darwin') {
    wowPath = '/Applications/World of Warcraft/_classic_/'
    onePath = '/Users/kaikai/OneDrive/wowBackup/'
}

var backupList = ['WTF', 'Interface', 'PARTICLES', 'SPELLS'];

function readPackages() {
    var result = [];
    var archiveFiles = fs.readdirSync(onePath).filter(e => e.indexOf('pkg') >= 0);
    for (let a of archiveFiles) {
        var zip = new Zip(path.join(onePath, a));
        var entries = zip.getEntries();
        entries.forEach(e => {
            var o = {};
            o.md5 = e.entryName;
            // o.pkg = zip
            result.push(o);
        });
    }
    return result;
}

async function backupNewadds(base) {
    var b = new Set();
    base.forEach(e => b.add(e.md5));
    var pkg = new Zip();

    function walkSync(dir, arr) {
        console.log(dir);
        if (!fs.existsSync(dir)) { return [] };
        function reclink(path) {
            if (fs.lstatSync(path).isSymbolicLink()) {
                return reclink(fs.readlinkSync(path));
            } else { return path; }
        }
        arr = arr || [];
        dir = reclink(dir);
        var items = fs.readdirSync(dir);
        items.forEach(function (item) {
            var fullpath = path.join(dir, item);
            var s = fs.statSync(fullpath);
            if (s.isDirectory()) {
                walkSync(fullpath, arr);
            } else {
                var o = path.parse(fullpath);
                if (o.base == '.DS_Store') { return };
                if (o.ext == '.bak') { return };
                var content = fs.readFileSync(fullpath);
                o.rpath = fullpath.replace(wowPath, '');
                o.md5 = md5(content);
                if (!b.has(o.md5)) {
                    pkg.addFile(o.md5, content);
                    b.add(o.md5);
                } //增量加入 pkg
                arr.push(o); //全量写入 filelist
            };
        });
        return arr;
    };

    var filelist = [];
    backupList.forEach(p => {
        console.log('Walking ' + p);
        filelist = filelist.concat(walkSync(path.join(wowPath, p)));
    });

    var t = new Date().toLocaleString().split('/').join('-').split(':').join('-').split('-').map(e => {
        if (e.length < 2) { return '0' + e } else { return e }
    }).join('-');


    if (pkg.getEntries().length > 0) {
        pkg.writeZip(path.join(onePath, 'pkg.' + t + '.zip'))
    }

    if (filelist.length > 0) {
        var md5log = papa.unparse(filelist, {
            header: true,
            newline: '\n',
            skipEmptyLines: true,
            delimiter: ',',
            columns: ['rpath', 'md5']
        });
        var log = new Zip();
        log.addFile('md5.txt', md5log);
        log.writeZip(path.join(onePath, 'log.' + t + '.zip'));
    }
}

(async () => {
    console.log('Reading pkgs')
    var oldbase = await readPackages();   // 读取旧备份数据
    await backupNewadds(oldbase);  // 读取 md5，生成 log 并将増量部分写入新的 zip
})();