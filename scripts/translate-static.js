import csvParser from "csv-parse/lib/sync.js"
import csvStringify from "csv-stringify/lib/sync.js"
import fs from "fs"

//* This script translates random but unchanging shit that's too annoying to do manually.

const FILES = {
        trainerReq: "src/data/trainer-title-requirements.csv",
        missions: "src/data/missions.csv",
        uma: "src/data/uma-name.csv",
        trTitles: "src/data/trainer-title.csv"
    }
const PFILES = {};
const FAN_AMOUNT = {
    "1000万": "10 million",
    "5000万": "50 million",
    "1億": "100 million"
}
const TRAINER_TITLE = {
    "との出会い": "Memories with $",
    "担当": "$'s Personal Trainer",
    "専属": "$'s Exclusive Trainer",
    "名手": "Masterful $ Trainer",
    "全冠": "Fully-crowned $"
}

function readFiles() {
    let currentFile;

    function parseRecords(rec, ctx) {
        currentFile[rec.text] = rec.translation;
        return null;
    }

    for (let file of Object.keys(FILES)) {
        currentFile = {};
        csvParser(fs.readFileSync(FILES[file], "utf8"), { columns: true, escape: undefined, trim: true, skip_empty_lines: true, quoted_string: true, on_record: parseRecords })
        PFILES[file] = currentFile;
    }    
    console.log("Files read.");
}

function translate() {
    for (let [jpText, enText] of Object.entries(PFILES.trainerReq)) {
        if (jpText == "text" || enText) continue; //skip header and translated entries
        translateSpecific("g1-3", jpText, PFILES.trainerReq)
        translateSpecific("e4s", jpText, PFILES.trainerReq)
        translateSpecific("fan", jpText, PFILES.trainerReq)
    }
    for (let [jpText, enText] of Object.entries(PFILES.missions)) {
        if (jpText == "text" || enText) continue; //skip header and translated entries
        translateSpecific("g1-3", jpText, PFILES.missions)
        translateSpecific("e4s", jpText, PFILES.missions)
        translateSpecific("fan", jpText, PFILES.missions)
        translateSpecific("gend", jpText, PFILES.missions)
        translateSpecific("stad", jpText, PFILES.missions)
        translateSpecific("wake", jpText, PFILES.missions)
        translateSpecific("star", jpText, PFILES.missions)
        translateSpecific("lbsupp", jpText, PFILES.missions)
        translateSpecific("friend", jpText, PFILES.missions)
    }
    for (let [jpText, enText] of Object.entries(PFILES.trTitles)) {
        if (jpText == "text" || enText) continue; //skip header and translated entries
        translateSpecific("trTitle", jpText, PFILES.trTitles)
    }
}

function translateSpecific (type, text, file) {
    let m;
    if (type == "g1-3") {
        m = text.match(/(.+)でGⅠ～GⅢの\\n全てのトロフィーを獲得しよう/)
        if (m) {
            let [,umaName] = m, umaNameEn = PFILES.uma[umaName];
            if (umaNameEn) {
                file[text] = `Obtain all G1-G3 trophies with ${umaNameEn}`;
            }
        }
    }
    else if (type == "e4s") {
        m = text.match(/(.+)の\\nウマ娘ストーリー第4話を見よう/)
        if (m) {
            let [,umaName] = m, umaNameEn = PFILES.uma[umaName];
            if (umaNameEn) {
                file[text] = `Read chapter 4 of ${umaNameEn}'s story`;
            }
        }
    }
    else if (type == "fan") {
        m = text.match(/(.+)のファン数を\\n累計(\d+[万億])人獲得しよう/)
        if (m) {
            let [,umaName, amount] = m, umaNameEn = PFILES.uma[umaName];
            if (umaNameEn) {
                file[text] = `Reach ${FAN_AMOUNT[amount]} total fans for ${umaNameEn}`;
            }
        }
    }
    else if (type == "gend") {
        m = text.match(/育成ウマ娘(\d+)人の\\nグッドエンディングをみよう/)
        if (m) {
            let [, amount] = m
            file[text] = `Reach ${amount} horsegirls' Good End`;
        }
    }
    else if (type == "stad") {
        m = text.match(/チーム競技場を\\n(\d+)回プレイしよう/)
        if (m) {
            let [, amount] = m
            file[text] = `Play in the Team Stadium ${amount} times`;
        }
    }
    else if (type == "wake") {
        m = text.match(/育成ウマ娘の覚醒Lvを\\n(\d+)回上げよう/)
        if (m) {
            let [, amount] = m
            file[text] = `Awaken a horsegirl ${amount} times`;
        }
    }
    else if (type == "star") {
        m = text.match(/育成ウマ娘を才能開花で\\n(\d+)回★を上げよう/)
        if (m) {
            let [, amount] = m
            file[text] = `Gain ${amount}★ through talent blooming horsegirls`;
        }
    }
    else if (type == "lbsupp") {
        m = text.match(/サポートカードを\\n(\d+)回上限解放しよう/)
        if (m) {
            let [, amount] = m
            file[text] = `Limit break a support card ${amount} times`;
        }
    }
    else if (type == "friend") {
        m = text.match(/(.+)の\\n親愛度ランクを1にしよう/)
        if (m) {
            let [,umaName] = m, umaNameEn = PFILES.uma[umaName];
            if (umaNameEn) {
                file[text] = `Reach friendship rank 1 with ${umaNameEn}`;
            }
        }
    }
    else if (type == "trTitle") {
        m = text.match(/(.+)(との出会い|担当|専属|名手|全冠)/)
        if (m) {
            let [,umaName, title] = m, umaNameEn = PFILES.uma[umaName];
            if (umaNameEn && title) {
                file[text] = TRAINER_TITLE[title].replace("$", umaNameEn).replace("s's", "s'");
            }
        }
    }
}

function writeFiles() {
    // Don't change files only used for lookup
    delete PFILES.uma;
    for (let [file, content] of Object.entries(PFILES)) {
        let records = []
        for (let [key, val] of Object.entries(content)) {
            records.push({text: key, translation: val});
        }
        // fs.writeFileSync(FILES[file], csvStringify(records, {escape: "\\", quoted_string: true, header: true}), "utf-8");
        //* since we currently intentionally mangle the header row..
        let string = `"text", "translation"\n` + csvStringify(records, {escape: undefined, quoted_string: true});
        fs.writeFileSync(FILES[file], string, "utf-8");
    }
}

console.log("Reading...");
readFiles();
console.log("Translating...");
translate();
console.log("Writing...");
writeFiles();