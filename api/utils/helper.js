import Jwt  from "jsonwebtoken";
import 'dotenv/config'

const jwtSecret = process.env.JWT_SECRET_KEY;
export async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            Jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) {
                    console.log("Token verification error:", err);
                    return reject('Invalid token');
                }
                resolve(userData);
            });
        } else {
            console.log("No token found in cookies");
            reject('No token');
        }
    });
}
