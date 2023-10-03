/*eslint-disable*/
import redisClient from "../utils/redis";
import dbClient from "../utils/db";

class UsersController {
  static async postNew(request, response) {
    const email = request.body.email;
    const password = request.body.password;
    if (!email) {
      response.status(400).json({ error: "Missing email" });
    } else if (!password) {
      response.status(400).json({ error: "Missing password" });
    } else {
      const user = await dbClient.findUser(email);
      if (user) {
        response.status(400).json({ error: "Already exist" });
      } else {
        const result = await dbClient.insertUser(email, password);
        response.status(201).json({ id: result.insertedId, email: email });
      }
    }
  }
  static async getMe(request, response) {
    const token = request.headers["x-token"];
    const userId = await redisClient.get(`auth_${token}`);
    const user = await dbClient.findUserById(userId);
    if (!user) {
      response.status(401).json({ error: "Unauthorized" });
    } else {
      const user = await dbClient.findUserById(userId);
      response.json({ id: user._id, email: user.email });
    }
  }
}

module.exports = UsersController;
