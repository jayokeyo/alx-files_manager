import { createClient } from "redis";
import { promisify } from "util";

// Class RedisClient containing a constructor

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on("error", (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
  }

  //   Check if there is connection error with redis

  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  //   an asynchronous function get that takes a string key as argument and returns the Redis value stored for this key
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }

  //   Set key vlue pair to redis server
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, time);
  }

  //   an asynchronous function del that takes a string key as argument and remove the value in Redis for this key
  async del(key) {
    const redisDel = promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
