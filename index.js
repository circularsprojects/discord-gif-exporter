const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const URL = require("url").URL;
const { FrecencyUserSettings } = require('discord-protos');
const colors = require('./colors.js');

if (!fs.existsSync(path.join(__dirname, 'gifs'))) {
    fs.mkdirSync(path.join(__dirname, 'gifs'));
    colors.yellowLog('[?] Created gifs directory')
}

(async () => {
    const protobuf = await getProtobuf();
    const data = await decodeProtobuf(protobuf);
    await downloadGifs(data);
})();

async function decodeProtobuf(protobuf) {
    const decoded = FrecencyUserSettings.fromBase64(protobuf);
    var data = JSON.stringify(decoded, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    );
    return data
}

async function getProtobuf() {
    var token = process.env.DISCORD_TOKEN;
    if (!token) {
        throw new Error('Environment variable TOKEN is not set');
    }
    const url = 'https://discord.com/api/v9/users/@me/settings-proto/2';
    const headers = {
        'authorization': token
    }
    const res = await fetch(url, { headers })
    if (!res.ok) {
        throw new Error(`Failed to fetch protobuf, status code: ${res.status}`);
    }
    const data = await res.text();
    const parsed = JSON.parse(data);
    return parsed['settings']
}

async function downloadGifs(data) {
    const obj = JSON.parse(data);
    var count = 0;
    const gifslength = Object.keys(obj.favoriteGifs.gifs).length;
    for (let key in obj.favoriteGifs.gifs) {
        count++;
        var gif = obj.favoriteGifs.gifs[key].src;
        //
        // URL validation
        //
        try {
            new URL(gif);
        } catch (e) {
            colors.redError('Invalid URL:', gif);
            continue;
        }
        if (gif.includes('tenor.co')) {
            //
            // download tenor "gifs"
            //
            const parsedTenorURL = parseTenorURL(gif);
            if (parsedTenorURL != undefined) {
                //
                // got the tenor gif url from the mp4 :3
                //
                gif = parsedTenorURL;
                await downloadgif(gif, key).then(() => {
                    colors.greenLog(`[${count}/${gifslength}] Downloaded ${gif}`);
                }).catch((err) => {
                    colors.redError(`[${count}/${gifslength}] ${err}`);
                });
            } else {
                //
                // looks like we weren't able to get the gif url from the mp4
                // this is probably because the url is tenor.co or similar
                // time to scrape :333
                //
                await fetch(key).then(async res => {
                    if (!res.ok) {
                        colors.redError(`[${count}/${gifslength}] Failed to fetch ${gif}, status code: ${res.status}`);
                        return;
                    }
                    const text = await res.text();
                    const contentUrlMatch = text.match(/<meta itemProp="contentUrl" content="([^"]+)"/);
                    if (contentUrlMatch && contentUrlMatch[1]) {
                        const contentUrl = contentUrlMatch[1];
                        gif = contentUrl.replace(/^https:\/\/media\d+\.tenor\.com\/m\//, 'https://media.tenor.com/');
                        colors.yellowLog(`[${count}/${gifslength}] Extracted content URL: ${gif}`);
                        await downloadgif(gif, key).then(() => {
                            colors.greenLog(`[${count}/${gifslength}] Downloaded ${gif}`);
                        }).catch((err) => {
                            colors.redError(`[${count}/${gifslength}] ${err}`);
                        });
                    } else {
                        colors.redError(`[${count}/${gifslength}] Failed to extract content URL from ${key}`);
                    }
                })
            }
        } else {
            //
            // download discord (and other) gifs
            //
            await downloadgif(gif, key).then(() => {
                colors.greenLog(`[${count}/${gifslength}] Downloaded ${gif}`);
            }).catch((err) => {
                colors.redError(`[${count}/${gifslength}] ${err}`);
            });
        }
    }
}

async function downloadgif(gif, key) {
    return new Promise(async (resolve, reject) => {
        await fetch(gif).then(res => {
            if (!res.ok) {
                reject(`Failed to download ${gif}, status code: ${res.status}`);
                return;
            }
            const splitkey = key.split("/")
            var filename = splitkey[splitkey.length - 1];
            if (!filename.endsWith('.gif')) {
                filename += '.gif';
            }
            var outputdir = path.join(__dirname, 'gifs', filename);
            if (fs.existsSync(outputdir)) {
                var i = 1;
                while (fs.existsSync(path.join(__dirname, 'gifs', `${filename.split('.gif')[0]}(${i}).gif`))) {
                    i++;
                }
                filename = `${filename.split('.gif')[0]}(${i}).gif`;
                outputdir = path.join(__dirname, 'gifs', filename);
            }
            const dest = fs.createWriteStream(outputdir);
            Readable.fromWeb( res.body ).pipe( dest );
            resolve();
        });
    });
}

function parseTenorURL(url) {
    //
    // Function slightly modifed and taken from nexpid's bunny plugins
    // https://github.com/nexpid/BunnyPlugins/blob/a6db46b0c7ef04b8adc3994b68e664db8295d33b/src/plugins/tenor-gif-fix/src/index.ts#L8-L17
    //
    const path = url.split("/");
    const tenorIndex = path.findIndex(x => x.endsWith(".tenor.com"));

    if (tenorIndex === -1) return;
    const [host, id, file] = path.slice(tenorIndex, tenorIndex + 3);

    if (!host || !id || !file) return;
    return `https://${host}/${id.slice(0, -2)}AC/${file.split(".")[0]}.gif`;
}