import Jwt  from "jsonwebtoken";
import 'dotenv/config'

const jwtSecret = process.env.JWT_SECRET_KEY;
export async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {

        const token = req.cookies?.token;
        if (token) {
            Jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    }); 
  }