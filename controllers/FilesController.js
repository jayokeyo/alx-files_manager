/*eslint-disable*/
import fs from "fs";
import path from "path";
import dbClient from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import redisClient from "../utils/redis";

class FilesController {
  static async postUpload(request, response) {
    const token = request.headers["x-token"];
    const userId = await redisClient.get(`auth_${token}`);
    const user = await dbClient.findUserById(userId);
    if (!user) {
      response.status(401).json({ error: "Unauthorized" });
    } else {
      const acceptedTypes = ["folder", "file", "image"];
      const name = request.body.name;
      const type = request.body.type;

      const parentId = request.body.parentId;
      const isPublic = request.body.isPublic;
      const data = request.body.data;

      if (!name) response.status(400).json({ error: "Missing name" });
      if (!type || !acceptedTypes.includes(type)) {
        response.status(400).json({ error: "Missing type" });
      }
      if (!data && type != "folder") {
        response.status(400).json({ error: "Missing data" });
      }
      if (parentId) {
        const parent = await dbClient.getParent(parentId);
        if (!parent) {
          response.status(400).json({ error: "Parent not found" });
        } else if (parent.type != "folder") {
          response.status(400).json({ error: "Parent is not a folder" });
        }
      }
      if (type === "folder") {
        const result = await dbClient.addToFilesCollection(
          userId,
          name,
          type,
          isPublic,
          parentId
        );
        response.status(201).json(result);
      } else {
        const fileData = Buffer.from(data, "base64");
        const filename = uuidv4();
        const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";
        const localPath = path.join(folderPath, filename);
        fs.mkdir(folderPath, { recursive: true }, (err) => {
          if (err) throw err;
          fs.writeFile(localPath, fileData, (err) => {
            if (err) throw err;
          });
        });

        const result = await dbClient.addToFilesCollection(
          userId,
          name,
          type,
          isPublic,
          parentId,
          localPath
        );
        response.status(201).json(result);
      }
    }
  }
}

module.exports = FilesController;
