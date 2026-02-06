const fs = require('fs')
const papa = require('papaparse')
const _ = require('lodash');
const path = require('path')


var aeerPath = 'd:\\World of Warcraft\\_classic_\\WTF\\Account\\169366368#3\\SavedVariables\\Auc-ScanData.lua';
const itemType = ['Consumable', 'Container', 'Weapon', 'Gem', 'Armor', 'Reagent', 'Projectile', 'Tradegoods', 'ItemEnhancement', 'Recipe', 'CurrencyTokenObsolete', 'Quiver', 'Questitem', 'Key', 'PermanentObsolete', 'Miscellaneous', 'Glyph', 'Battlepet', 'WoWToken']
const scantimeRegex = /(?<=\[\"endTime\"\]\s+=\s+)\d{10}/

if (process.platform == 'darwin') {
    aeerPath = '/Applications/World of Warcraft/_classic_/WTF/Account/169366368#3/SavedVariables/Auc-ScanData.lua'
    atorPath = '/Applications/World of Warcraft/_classic_/WTF/Account/169366368#3/SavedVariables/Auctionator.lua'
}

var aeerData = fs.readFileSync(aeerPath, 'utf-8');


var props = ['Hitem', 'iLvl', 'itemTypeID', 'subTypeID', 'InventoryTypeID', 'thisbid', 'leftTime', 'scantime', 'name', 9, 'stack', 'quality', 'canUse', 'useLvl', 'firstbid', 'minIncrement', 'buyout', 'nowPrice', 18, 'seller', 20, 21, 'itemID', "rndEnchant", 24, 'enchant', 'rndEntItemID']
var data = aeerData
    .match(/\"return .*/g)
    .reduce((base, add) => {
        return base.concat(add.match(/\{\\\"\|c.*?\}/g));
    }, [])
    .map(e => {
        return _.zipObject(props, e.slice(1, -1).split(','))
    });

var scantimeT = aeerData.match(scantimeRegex)[0];
var scantimestamp = new Date(scantimeT * 1000).toLocaleString();


data.forEach(e => {
    e.scantime = scantimestamp;
    e.Hitem = e.Hitem.slice(2, -2);
    e.name = e.name.slice(2, -2);
    e.seller = e.seller.slice(2, -2);
    e['21'] = e['21'].slice(2, -2);
    e.itemType = itemType[e.itemTypeID];
});

// var base = {};
// data.forEach(e => {
//     Object.entries(e).forEach(p => {
//         base[p[0]] = base[p[0]] || {};
//         base[p[0]][p[1]] = base[p[0]][p[1]] + 1 || 1;
//     })
// });
// console.log(base)

var towrite = papa.unparse(data, {
    header: true,
    delimiter: ',',
    columns: props.concat(['scantime'])
})

fs.writeFileSync(path.join('aucData', scantimeT + '.csv'), towrite, 'utf-8');

console.log(scantimestamp)

