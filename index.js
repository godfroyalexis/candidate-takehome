const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const db = require('./models');

const Op = db.Sequelize.Op;

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games/populate', async (req, res) => {
  try {
    let os = {"android" : "https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json",
                  "ios" : "https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json"}
    let options = {json: true};

    for (let key in os) {
      request(os[key], options, (error, response, body) => {
        if (error) {
          return  console.log(error)
        }
        if (!error && response.statusCode === 200) {
            for (let gameArray in body) {
              for (let game in body[gameArray]) {
                let gameInfo = body[gameArray][game];
                db.Game.create({
                  publisherId : gameInfo.publisher_id,
                  name : gameInfo.name,
                  platform : gameInfo.os,
                  bundleId: gameInfo.bundle_id,
                  appVersion:gameInfo.version })
              }
            }
        }
      });
    }
    res.send("Database was populated");
  } catch (err) {
    return res.send(err);
  }
})

app.get('/api/games', async (req, res) => {
  try {
    const games = await db.Game.findAll()
    return res.send(games)
  } catch (err) {
    console.error('There was an error querying games', err);
    return res.send(err);
  }
})

app.post('/api/games/search', async (req, res) => {
    try {
     const games = await db.Game.findAll({
       where: {
         [Op.and]: [
           req.body.platform ? { platform: req.body.platform } : "",
           req.body.name ? { name: {
               [Op.like]: "%" + req.body.name + "%"
              }
            } : "",
         ]
       }
     })
      return res.send(games);
 } catch (err) {
   console.error('There was an error querying games', err);
   return res.send(err);
 }
})

app.post('/api/games', async (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  try {
    const game = await db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    return res.send(game)
  } catch (err) {
    console.error('***There was an error creating a game', err);
    return res.status(400).send(err);
  }
})

app.delete('/api/games/:id', async (req, res) => {
  try {
    const game = await db.Game.findByPk(parseInt(req.params.id))
    await game.destroy({ force: true })
    return res.send({ id: game.id  })
  } catch (err) {
    console.error('***Error deleting game', err);
    return res.status(400).send(err);
  }
});

app.put('/api/games/:id', async (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  try {
    const game = await db.Game.findByPk(id)
    await game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    return res.send(game)
  } catch (err) {
    console.error('***Error updating game', err);
    return res.status(400).send(err);
  }
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
