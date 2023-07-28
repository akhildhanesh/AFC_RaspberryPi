import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const URL = 'https://afcd.cloud/api/messages.json' // Server URL
const TITLE = 'AFC' // Pushover Notification Title

const UID = process.env.UID // Unique product ID

const data = {
    uid: UID,
    title: TITLE,
    message: `Warning => ......`,
    priority: 1
}
axios.post(URL, data)
    .then(res => res.data)
    .then(msg => console.log(msg))
    .catch(err => console.error('Error', err))