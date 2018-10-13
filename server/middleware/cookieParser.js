// Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
// Optionally you may enable signed cookie support by passing a secret string,
// which assigns req.secret so it may be used by other middleware.

const parseCookies = (req, res, next) => {

  let cookieString = req.get('Cookie') || '';
  cookieString = cookieString.split('; ');

  var obj = {};

  if (cookieString[0] !== '')  {

    cookieString.forEach(el => {
      var sub = el.split('=');
      let key = sub[0];
      let value = sub[1];
      obj[key] = value;
    });

  }

  req.cookies = obj;
  console.log(obj);
  next();

};






module.exports = parseCookies;