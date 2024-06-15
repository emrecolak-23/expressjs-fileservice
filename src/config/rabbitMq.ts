import amqplib, { Connection, Channel } from "amqplib"

class Amqblib {
    private _connection?: Connection
    private _channel?: Channel

    get connection() {
        if (!this._connection) {
            throw new Error('Cannot access Rabbit Mq channel before connecting')
        }

        return this._connection
    }

    getChannel() {
        return this._channel
    }

    async connect(url: string, queueName: string): Promise<Connection> {
        try {

            this._connection = await amqplib.connect(url)
            this._channel = await this._connection.createChannel()

            await this._channel.assertQueue(queueName, { durable: true });

            return this._connection
        } catch (err) {
            throw new Error('Connection to RabbitMQ failed')
        }
    }

    async close() {
        if (this._channel) {
            await this._channel.close()
        }
        if (this._connection) {
            await this._connection.close()
        }
    }

}

export const rabbitMQ = new Amqblib()
export { Connection } from "amqplib"