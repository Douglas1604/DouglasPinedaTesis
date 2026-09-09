const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const Keys = require("./keys");
const Usuario = require("../models/usuariosModel")

module.exports = (passport) => {
  let opts = [];
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = Keys.secretOrKey;

  passport.use(
    "jwt-usuario",
    new JwtStrategy(opts, (jwt_payload, done) =>{
      Usuario.getById(jwt_payload.id, (err, usuario)=>{

        if(err){
          return done(err, false);
        }
        if(usuario){
          return done(null, usuario);
        }else{
          return done(null, false);
        }
      });
    })
  );
}