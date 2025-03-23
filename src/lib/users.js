import { getUsersFromDB } from './storage/mongo.js';

/**
 * Handles GET request for retrieving all users.
 */
export async function getUsers(req, res) {
    try {
        const users = await getUsersFromDB();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
