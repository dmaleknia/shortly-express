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

app.use(require('./middleware/cookieParser'));
// app.use(Auth.createSession);


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
  (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    models.Users.get({username: username})
      .then(user => {
        if (user === undefined) {
          models.Users.create({username, password});
          res.redirect('/');
        } else {
          res.direct('/signup'); // this should send to /login  NOT to /signup!!!
        }
      })
      .error(error => {
        throw new Error('ER_DUP_ENTRY');
      })
      .catch(() => {
        res.redirect('/signup'); // this should send to /login  NOT to /signup!!!
      });

  });


app.get('/login',
  (req, res) => {
    res.render('login');
  });

app.post('/login',
  (req, res) => {
    let username = req.body.username;
    let attempted = req.body.password;

    // console.log(req.session, 'sessions----------------')

    // the salt is stored in the database; we can find it based on the username
    // verify if the username is valid
    // we add the salt to both passwords (the one on the database and the one submitted by user)
    // compare these values
    // if they're the same, log the user in, redirect them to the /
    // if they're not the same, redirect to /login

    /**
   * Compares a password attempt with the previously stored password and salt.
   * @param {string} attempted - The attempted password.
   * @param {string} password - The hashed password from when the user signed up.
   * @param {string} salt - The salt generated when the user signed up.
   * @returns {boolean} A boolean indicating if the attempted password was correct.
   */
    // compare(attempted, password, salt) {
    //   return utils.compareHash(attempted, password, salt);
    // }


    models.Users.get({username: username})
      .then(user=> {
        let password = user.password;
        let salt = user.salt;
        return models.Users.compare(attempted, password, salt);
      })
      .then(bool => {
        if (bool === false) {
          res.redirect('/login');
        } else {
          res.redirect('/');
        }
      })
      .error(error => {
        throw new Error('USER NOT FOUND');
        res.redirect('/login');
      })
      .catch(() => {
        res.redirect('/login');
      });
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
