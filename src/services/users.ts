import axios from "axios"
import { User } from "../models/users"
class UsersService {

    async getUserInformation(token: string) {

        const baseUri = process.env.USERS_SERVICE_URI

        const response = await axios.get(`${baseUri}/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return response.data
    }

    async getUserBackofficeInformation(token: string) {

        const baseUri = process.env.USERS_BACKOFFICE_SERVICE_URI

        const response = await axios.get(`${baseUri}/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return response.data
    }

    async getUserById(userId: number) {
        const user = await User.findOne({ userId})
        return user
    }
}

export { UsersService }