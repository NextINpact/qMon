const puppeteer = require('puppeteer');
const googleTrends = require('google-trends-api');
const fs = require('fs');
const moment = require('moment');

let qwantData = [];
let bingData = [];
let googleData = [];
const trendings = [];

const ytb = [
    "David Guetta",
    "Squeezie",
    "Cyprien Iov",
    "Norman Thavaud",
    "Gims",
    "Rémi Gaillard",
    "DJ Snake",
    "Tibo InShape",
    "L'Algérino",
    "Amixem",
    "Mister V",
    "Natoo",
    "Oggy",
    "Seb La Frite",
    "CYR!L",
    "Niska",
    "Jul",
    "Lartiste",
    "Andy Raconte",
    "EnjoyPhoenix",
    "Aymane Serhani",
    "Grégoire Ludig",
    "David Marsais",
    "Jeremy Nadeau",
    "MHD",
    "Thomas Bangalter",
    "Guy-Manuel de Homem-Christo",
    "Dr Nozman",
    "Sébastien Cauet",
    "Black M",
    "Dadju",
    "Pierre Croce",
    "Soprano",
    "Booba",
    "Aya Nakamura",
    "Antoine Daniel",
    "Sananas",
    "Hugo Dessioux",
    "Marwa Loud",
    "Poisson Fécond",
    "Lacrim",
    "Doc Seven",
    "Indila",
    "Shera Kerienski",
    "Kendji Girac",
    "Oli",
    "Bigflo",
    "Orelsan",
    "Coco Chanel",
    "Jeremstar",
    "Marc Jarousseau",
    "Gradur",
    "Fabien Olicard",
    "La Fouine",
    "Nekfeu",
    "Maxenss",
    "Didi Chandouidoui",
    "Vitaa",
    "Bilal Hassani",
    "Bruce Benamran",
    "Kalash",
    "Keen'V",
    "Louane",
    "Benjamin Brillaud",
    "Patrick Sébastien",
    "Vald",
    "Tal",
    "Léo Grasset",
    "M. Pokora",
    "Tina S",
    "Madeon",
    "Jeff Panacloc"
];

const social = ['instagram', 'facebook', 'twitter'];


/* Prog*/

console.log('== starting qMon ! ==')

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    return 0;
}

async function scrapeQwant(page, keyword) {
    const result = await page.evaluate((keyword) => {
            const ldata = [];
            var res = document.querySelectorAll('.result.result--web');
            res.forEach((item) => {
                const title = item.querySelector('h3').innerText;
                const link = item.querySelector('a').href;
                const desc = item.querySelector('p').innerText;
                ldata.push({title, link, desc, keyword});

            });

            return ldata;
        }, keyword
    );

    qwantData = [...qwantData, result];
    return 0;
}

async function scrapeBing(page, keyword, pageNum, url) {
    const result = await page.evaluate((keyword) => {
            const ldata = [];
            var res = document.querySelectorAll('.b_algo');
            res.forEach((item) => {
                let title = 'title n/a';
                let link = 'link n/a';
                let desc = 'desc n/a';

                 try {
                     title = item.querySelector('h2').innerText;
                 } catch (e) {

                 }
                 try {
                     link = item.querySelector('a').href;
                 }
                 catch (e) {

                 }
                 try {
                     desc = item.querySelector('p').innerText;
                 }catch (e) {

                 }

                ldata.push({title, link, desc, keyword});

            });

            return ldata;
        }, keyword
    );

    bingData = [...bingData, result];
    if (pageNum < 5) {
        const np = (pageNum * 10) - 1;

        await page.goto(`${url}&first=${np}`, {waitUntil: 'networkidle2'});
        await autoScroll(page);
        return await scrapeBing(page, keyword, pageNum + 1, url);
    }
    return 0;
}


function writeResults() {
    const qwantFileName = 'results-qwant.json';
    fs.writeFile(qwantFileName, JSON.stringify(qwantData, null, 4), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + qwantFileName);
        }
    });

    const bingFileName = 'results-bing.json';

    fs.writeFile(bingFileName, JSON.stringify(bingData, null, 4), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + bingFileName);
        }
    });

}


googleTrends.dailyTrends({
    trendDate: moment().subtract(1, 'days').toDate(),
    geo: 'FR',
}, (err, results) => {
    if (err) {

    } else {
        const data = JSON.parse(results);
        const array = data.default.trendingSearchesDays[0].trendingSearches;

        array.forEach(x => {

            if (!!x.title.query) {
                trendings.push(x.title.query);
            }

        });

        ytb.forEach(x => {
            social.forEach(y => {
                trendings.push(`${x} ${y}`);
            });
        });


        (async () => {
            const browser = await puppeteer.launch({headless: false});
            const qwantPage = await browser.newPage();
            qwantPage.setViewport({
                width: 2560,
                height: 1440,
                deviceScaleFactor: 1,
            });

            const bingPage = await browser.newPage();
            bingPage.setViewport({
                width: 2560,
                height: 1440,
                deviceScaleFactor: 1,
            });

            for (var idx in trendings) {
                const item = trendings[idx];
                let qwantUrl = `https://www.qwant.com/?q=${encodeURIComponent(item)}&t=web`;
                let bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(item)}`;
                console.log(qwantUrl);
                await qwantPage.goto(qwantUrl, {waitUntil: 'networkidle2'});
                await bingPage.goto(bingUrl, {waitUntil: 'networkidle2'});
                let qwantScrollTask = autoScroll(qwantPage);
                let bingScrollTask = autoScroll(bingPage);

                let scrollRes = await qwantScrollTask + await bingScrollTask;

                let qwantScrapeTask = scrapeQwant(qwantPage, item);
                let bingScrapeTask = scrapeBing(bingPage, item,1, bingUrl);

                let scrapeRes = await qwantScrapeTask + await bingScrapeTask;


            }


            await browser.close();
            writeResults();
        })();


    }
});






