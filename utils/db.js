/*eslint-disable*/
import crypto from "crypto";
import { MongoClient, ObjectId } from "mongodb";

const HOST = process.env.DB_HOST || "localhost";
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || "files_manager";
const url = `mongodb://${HOST}:${PORT}`;

// class DBClient containing a constructor

class DBClient {
  constructor() {
    this.client = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(`${DATABASE}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //   check if the connection to the MongoClient is successful

  isAlive() {
    return this.client.isConnected();
  }

  //   an asynchronous function nbUsers that returns the number of documents in the collection users

  async nbUsers() {
    const users = this.db.collection("users");
    const usersNum = await users.countDocuments();
    return usersNum;
  }

  //   an asynchronous function nbFiles that returns the number of documents in the collection files
  async nbFiles() {
    const files = this.db.collection("files");
    const filesNum = await files.countDocuments();
    return filesNum;
  }
  async findUser(email) {
    const users = this.db.collection("users");
    const user = await users.findOne({ email: email });
    return user;
  }

  async findUserById(userId) {
    const users = this.db.collection("users");
    const searchId = new ObjectId(userId);
    const user = await users.findOne({ _id: searchId });
    return user;
  }

  async insertUser(email, password) {
    const users = this.db.collection("users");
    const sha1Hash = crypto.createHash("sha1");
    sha1Hash.update(password);
    const hashedPass = sha1Hash.digest("hex");
    const result = await users.insertOne({
      email: email,
      password: hashedPass,
    });
    return result;
  }
  async getParent(parentId) {
    const files = this.db.collection("files");
    const searchId = new ObjectId(parentId);
    const parent = await files.findOne({ _id: searchId });
    return parent;
  }

  async addToFilesCollection(
    userId,
    name,
    type,
    isPublic = false,
    parentId = "0",
    localPath
  ) {
    let results;
    const files = this.db.collection("files");
    if (type === "folder") {
      results = await files.insertOne({
        userId: new ObjectId(userId),
        name: name,
        type: type,
        isPublic: isPublic,
        parentId: parentId === "0" ? parentId : new ObjectId(parentId),
      });
    } else {
      results = await files.insertOne({
        userId: new ObjectId(userId),
        name: name,
        type: type,
        isPublic: isPublic,
        parentId: parentId === "0" ? parentId : new ObjectId(parentId),
        localPath: localPath,
      });
    }
    const result = results.ops[0];
    const file = {
      id: result._id,
      userId: result.userId,
      name: result.name,
      type: result.type,
      isPublic: result.isPublic,
      parentId: result.parentId === "0" ? parseInt(result.parentId, 10) : result.parentId,
    };
    return file;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
