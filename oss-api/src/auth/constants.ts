import 'dotenv/config';

export const jwtConstants = {
  //TODO: change sectret, save it in an appropriate way, anina schauen ob dieses überhaupt gebraucht wird
  secret: process.env.JWT_SECRET,
};
