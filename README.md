# discord gif exporter
this node.js script just exports all your fav gifs

gifs will be output to the gifs/ directory

you need to specify a DISCORD_TOKEN environment variable,
you can do this by making a .env file with a DISCORD_TOKEN field like so:
```
DISCORD_TOKEN="really awesome token"
```
and running the script with `node --env-file=.env index.js`

or just add the token to your environment however you'd normally do it

## how it works
it gets your favorited settings from discord in the form of a protobuf, decodes them, and then goes through the list one by one downloading each gif

discord gifs are downloaded automatically, for tenor gifs the script either changes the url to be a gif, or scrapes the tenor website for the gif url.
(idk if you'll run into cloudflare challenges with this tho, in my experience i never did)
