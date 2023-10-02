/*eslint-disable*/
import dbClient from "../utils/db";

class UserController {
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
}

module.exports = UserController;
