const fs = require('fs');
const path = require('path');
const { PreloadedUserSettings, FrecencyUserSettings } = require('discord-protos');

fs.readFile(path.join(__dirname, 'sample2.txt'), (err, data) => {
    const decoded = FrecencyUserSettings.fromBase64(data.toString());
    var data = JSON.stringify(decoded, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    );
    fs.writeFileSync(path.join(__dirname, 'sample2.json'), data);
});