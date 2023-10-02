/*eslint-disable*/
import redisClient from "../utils/redis";
import dbClient from "../utils/db";
import { v4 as uuidv4 } from "uuid";

class AuthController {
  static async getConnect(request, response) {
      const authHeader = request.headers.authorization;
      const base64String = authHeader.split(' ')[1];

      const decodedString = Buffer.from(base64String, 'base64').toString('utf-8');
      const email = decodedString.split(':')[0];

      const user = await dbClient.findUser(email);
      if (!user) {
        response.status(401).json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        const key = `auth_${token}`;
        redisClient.set(key, user._id.toString(), 1000 * 60 * 60 * 24);
        response.status(200).json({ token: token });
      }
  }
  static async getDisconnect(request, response) {
    const token = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      response.status(401).json({ error: 'Unauthorized' });
    } else {
      redisClient.del(`auth_${token}`);
      response.status(204).end();
    }
  }
}

module.exports = AuthController;