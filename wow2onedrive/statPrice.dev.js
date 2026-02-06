const fs = require('fs')
const papa = require('papaparse')
const _ = require('lodash');
const path = require('path');


const props = ['Hitem', 'iLvl', 'itemTypeID', 'subTypeID', 'InventoryTypeID', 'thisbid', 6, 'time', 'name', 9, 'stack', 'quality', 'canUse', 'useLvl', 'firstbid', 'minIncrement', 'buyout', 'nowPrice', 18, 'seller', 20, 21, 'itemID', 23, 24, 'enchant', 26]

async function readCSV(filepath) {
    return new Promise((resolve, reject) => {
        papa.parse(fs.readFileSync(filepath, 'utf8'), {
            header: true,
            dynamicTyping: true,
            complete: function (result) {
                resolve(result.data)
            }
        });
    });
}

async function statsPrice(filepath) {
    var 档位 = [10, 100, 1000]
    var data = await readCSV(filepath);
    data.forEach(e => {
        e.avgPrice = e.buyout / e.stack;
    });
    data = _.orderBy(data, ['itemID', 'avgPrice'], ['asc', 'asc']);
    data = _.groupBy(data, 'itemID')
    data = Object.values(data);
    data = data.map(e => {
        var result = Object.assign({}, e[0]);
        result.lower1 = result.avgPrice;
        var count = 0, sum = 0;
        for (let i = 0; i < e.length; i++) {
            var item = e[i];
            count += item.stack;
            sum += item.buyout;

            if (!result.lower10 && count >= 10) {
                result.lower10 = (sum - (count - 10) * item.avgPrice) / 10
            }
            if (!result.lower100 && count >= 100) { }
            if (!result.lower1000 && count >= 1000) { }
        }

        return result;
    });
    console.log(data);
}

statsPrice("aucData/1667525744.csv")