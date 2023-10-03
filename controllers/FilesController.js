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
        }
        if (parent.type != "folder") {
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
  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const fileId = request.params.id;
    const files = dbClient.db.collection("files");
    const idObject = new ObjectID(fileId);
    const file = await files.findOne({ _id: idObject, userId: user._id });
    if (!file) {
      return response.status(404).json({ error: "Not Found" });
    }
    return response.status(200).json(file);
  }

  static async getIndex(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: "Unauthorized" });
    }
    const { parentId, page } = request.query;
    const pageNum = page || 0;
    const files = dbClient.db.collection("files");
    let query;
    if (!parentId) {
      query = { userId: user._id };
    } else {
      query = { userId: user._id, parentId: ObjectID(parentId) };
    }
    files
      .aggregate([
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [
              { $count: "total" },
              { $addFields: { page: parseInt(pageNum, 10) } },
            ],
            data: [{ $skip: 20 * parseInt(pageNum, 10) }, { $limit: 20 }],
          },
        },
      ])
      .toArray((err, result) => {
        if (result) {
          const final = result[0].data.map((file) => {
            const tmpFile = {
              ...file,
              id: file._id,
            };
            delete tmpFile._id;
            delete tmpFile.localPath;
            return tmpFile;
          });
          return response.status(200).json(final);
        }
        console.log("Error Occured");
        return response.status(404).json({ error: "Not Found" });
      });
    return null;
  }
}

module.exports = FilesController;
