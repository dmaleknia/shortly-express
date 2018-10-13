// Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
// Optionally you may enable signed cookie support by passing a secret string,
// which assigns req.secret so it may be used by other middleware.

const parseCookies = (req, res, next) => {
  // let username = req.body.username;
  // let password = req.body.password;

  // console.log(`req.body ${JSON.stringify(req)}`);

  // console.log(req);

  let cookieString = req.get('Cookie') || '';

  var obj = {};

  cookieString = cookieString.split('; ');
  console.log(cookieString);

  if (cookieString[0] !== '') {

    cookieString.forEach(el => {
      var sub = el.split('=');
      let key = sub[0];
      let value = sub[1];
      console.log(`key: ${key}    value: ${value}`);
      obj[key] = value;
    });

  }

  req.cookies = obj;
  next();

};






module.exports = parseCookies;