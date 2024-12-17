function blackLog(message) {
    console.log(`${black}${message}${reset}`)
}

function redLog(message) {
    console.log(`${red}${message}${reset}`)
}

function redError(message) {
    console.error(`${red}${message}${reset}`)
}

function yellowLog(message) {
    console.log(`${yellow}${message}${reset}`)
}

function greenLog(message) {
    console.log(`${green}${message}${reset}`)
}

function blueLog(message) {
    console.log(`${blue}${message}${reset}`)
}

function magentaLog(message) {
    console.log(`${magenta}${message}${reset}`)
}

function cyanLog(message) {
    console.log(`${cyan}${message}${reset}`)
}

function whiteLog(message) {
    console.log(`${white}${message}${reset}`)
}

const black = "\u001b[30m";
const red = "\u001b[31m"
const yellow = "\u001b[33m"
const green = "\u001b[32m"
const blue = "\u001b[34m"
const magenta = "\u001b[35m"
const cyan = "\u001b[36m"
const white = "\u001b[37m";
const reset = "\u001b[0m"

module.exports = {blackLog,redLog,redError,yellowLog,greenLog,blueLog,magentaLog,cyanLog,whiteLog,black,red,yellow,green,blue,magenta,cyan,white,reset}
