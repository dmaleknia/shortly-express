const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const Users = require('./models/user');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));


app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup',
  (req, res) => {
    res.render('signup');
  });


// verify that the user is not in the database
// if user is not in the database
// create a new user

app.post('/signup',
  (req, res, next) => {

    console.log(req.body, '<------------------request body');

    var username = req.body.username;
    var password = req.body.password;

    // models.Users.create({username, password});
    //console.log(models.Users.get({username: username}));

    // models.Users.create({username, password});
    // res.end();

    models.Users.get({username: username})
      .then(user => {
        // console.log(JSON.stringify(user), 'stringy thingy');

        if (user === undefined) {
          console.log("ITS UNDEFINED - OK to ADD");
          models.Users.create({username, password});
          res.redirect('/');
        } else {
          res.direct('/signup');
        }


        // if (user !== undefined) {
        //   throw new Error('ER_DUP_ENTRY');
        //   console.log('USER EXISTS please login');
        //   //send user to login
        // } else {
        //   // models.Users.create({username, password});
        //   // res.end();
        // }
      })
      .error(error => {
        throw new Error('ER_DUP_ENTRY');
        res.redirect('/signup');
        // res.status(500).send(error);
      })
      .catch(() => {
        res.redirect('/signup');
      });
  });


app.get('/login',
  (req, res) => {
    res.render('login');
  });

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
