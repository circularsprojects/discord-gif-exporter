const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const URL = require("url").URL;
const ffmpeg = require('fluent-ffmpeg');

fs.readFile(path.join(__dirname, 'sample2.json'), async (err, data) => {
    // print json keys
    const obj = JSON.parse(data);
    // create gifs/ and mp4s/
    if (!fs.existsSync(path.join(__dirname, 'gifs'))) {
        fs.mkdirSync(path.join(__dirname, 'gifs'));
        console.log('Created gifs directory')
    }
    if (!fs.existsSync(path.join(__dirname, 'mp4s'))) {
        fs.mkdirSync(path.join(__dirname, 'mp4s'));
        console.log('Created mp4s directory')
    }
    var count = 0;
    const gifslength = Object.keys(obj.favoriteGifs.gifs).length;
    for (let key in obj.favoriteGifs.gifs) {
        count++;
        const gif = obj.favoriteGifs.gifs[key].src;
        // check if the gif url is valid, if not, skip
        // parse the url
        try {
            new URL(gif);
        } catch (e) {
            console.error('Invalid URL:', gif);
            continue;
        }
        // if its a tenor mp4, download as an mp4 and put in seperate directory, if its anything else, download as a gif
        if (gif.includes('tenor.co')) {
            // download as mp4
            await fetch(gif).then(res => {
                if (!res.ok) {
                    console.error(`[!] Failed to download ${gif}, status code: ${res.status}`);
                    return;
                }
                const splitkey = key.split("/")
                const outputdir = path.join(__dirname, 'mp4s', splitkey[splitkey.length - 1] + '.mp4');
                console.log(`[${count}/${gifslength}] Downloading ${outputdir}...`)
                const dest = fs.createWriteStream(outputdir);
                //res.body.pipe(dest);
                Readable.fromWeb( res.body ).pipe( dest );
            });
        } else {
            await fetch(gif).then(res => {
                if (!res.ok) {
                    console.error(`[!] Failed to download ${gif}, status code: ${res.status}`);
                    return;
                }
                const splitkey = key.split("/")
                var filename = splitkey[splitkey.length - 1];
                if (!filename.endsWith('.gif')) {
                    filename += '.gif';
                }
                const outputdir = path.join(__dirname, 'gifs', filename);
                console.log(`[${count}/${gifslength}] Downloading ${outputdir}...`)
                const dest = fs.createWriteStream(outputdir);
                //res.body.pipe(dest);
                Readable.fromWeb( res.body ).pipe( dest );
            });
        }
    }
    // go through gifs/ and if the gif is 0 bytes, delete it
    fs.readdir(path.join(__dirname, 'gifs'), (err, files) => {
        files.forEach(file => {
            const stats = fs.statSync(path.join(__dirname, 'gifs', file));
            if (stats.size == 0) {
                fs.unlinkSync(path.join(__dirname, 'gifs', file));
                console.log(`Cleaning up - Deleted ${file}`)
            }
        });
    });
    // go through mp4s/ and use ffmpeg to convert it to a gif
    fs.readdir(path.join(__dirname, 'mp4s'), (err, files) => {
        const fileslength = files.length;
        var count = 0;
        files.forEach(async file => {
            count++;
            const input = path.join(__dirname, 'mp4s', file);
            const output = path.join(__dirname, 'gifs', file.replace('.mp4', '.gif'));
            console.log(`[${count}/${fileslength}] Converting ${input} to ${output}...`)
            await ffmpegConvert(input, output).then(() => {
                console.log(`[${count}/${fileslength}] Converted ${input} to ${output}`);
            });
        });
    });
})

function ffmpegConvert(input, output) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .output(output)
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
}