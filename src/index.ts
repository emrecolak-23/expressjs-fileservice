import mongoose from "mongoose";
import { app } from "./app";
import { Connection, rabbitMQ } from "./config/rabbitMq";
import { ConsulInstance } from "./config/consul";
import cron from "node-cron";
import { Files } from "./models/files";
import { Briefcase } from "./models/briefcases";
import { S3UploadService } from "./services/aws";
import { UserListener } from "./events/listeners/user/UserListener";

let rabbitMqConn: Connection;
let consulInstance: any;
let channel: any;

const start = async () => {
  if (!process.env.PORT) {
    throw new Error("PORT must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.NODE_ENV) {
    throw new Error("NODE_ENV must be defined");
  }

  if (!process.env.CONSUL_URI) {
    throw new Error("CONSUL_URI must be defined");
  }

  if (!process.env.CONSUL_SERVICE) {
    throw new Error("CONSUL_SERVICE must be defined");
  }

  if (!process.env.AMQP_URI) {
    throw new Error("AMQP_URI must be defined");
  }

  try {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI!, {
      dbName: "Files",
    });
    console.log("Connected to MongoDB");

    const consulHost = process.env.CONSUL_URI;
    const consulServie = process.env.CONSUL_SERVICE;
    consulInstance = new ConsulInstance(consulServie, consulHost!);
    await consulInstance.registerService();

    const RABBIT_MQ_URI = process.env.AMQP_URI;

    rabbitMqConn = await rabbitMQ.connect(RABBIT_MQ_URI!, consulServie);
    console.log("Connected to RabbitMQ");
    channel = rabbitMQ.getChannel();

    new UserListener(channel).subscribe();

    const s3UploadService = new S3UploadService();
    const task = cron.schedule("0 0 * * *", async () => {
      console.log("Cron job started");
      const twoDayAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const files = await Files.find({
        createdAt: { $lt: twoDayAgo },
        isActive: false,
      });

      for (const file of files) {
        await Briefcase.updateOne(
          { userId: file.userId },
          { $pull: { files: file._id } }
        );
      }

      
      for (const file of files) {
        console.log("Files to be deleted: ", file._id, file.isActive);
        await s3UploadService.deleteFileFromS3(file.path);
        await Files.deleteMany({ _id: file._id });
      }
    });

    const handleProcessTermination = async () => {
      try {
        await consulInstance.deregisterService();
        await rabbitMqConn.close();
        task.stop();
        process.exit(0);
      } catch (err) {
        console.error(`Error during termination: ${err}`);
        process.exit(1);
      }
    };

    process.on("SIGINT", handleProcessTermination); // Handles Ctrl+C
    process.on("SIGTERM", handleProcessTermination); // Handles external termination
    process.on("beforeExit", handleProcessTermination); // Handles unhandled exceptions
  } catch (error: any) {
    throw new Error(error.message);
  }

  const PORT = process.env.PORT;

  app.listen(PORT, () => {
    console.log("Server listening at: ", PORT);
  });
};

start();

export { consulInstance, rabbitMqConn, channel };
