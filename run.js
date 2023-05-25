import axios from 'axios'
import { Gpio } from 'onoff'
import * as dotenv from 'dotenv'

dotenv.config()

const TOKEN = process.env.API_KEY
const USER = process.env.USER_KEY
const URL = 'https://api.pushover.net/1/messages.json'
const TITLE = 'Node.js Alert'

const IrPin = new Gpio(4, 'in', 'both')
const PirPin = new Gpio(27, 'in', 'both')
const relayPin = new Gpio(18, 'out')

let IR = false
let PIR = false
let timer1 = {}
let timer2 = {}
let timer3 = {}
let relayState = false

IrPin.watch((err, value) => {
    if (err) throw err

    if (value === 1) {
        IR = true
        console.log('IR: Object detected!');
    } else {
        IR = false
        if (relayState) {
            relayPin.writeSync(0)
        }
        relayState = false
        console.log('IR: No object detected.');
    }
})

PirPin.watch((err, value) => {
    if (err) throw err

    if (value === 1) {
        if (PIR) {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
        PIR = false
        console.log('PIR: Movement Detected');
    } else {
        if (IR) {
            PIR = true
            timer1 = setTimeout(() => {
                const data = {
                    token: TOKEN,
                    user: USER,
                    title: TITLE,
                    message: `Warning: 1`
                }
                axios.post(URL, data)
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 60000)
            timer2 = setTimeout(() => {
                const data = {
                    token: TOKEN,
                    user: USER,
                    title: TITLE,
                    message: `Warning: 2`,
                    priority: 1
                }
                axios.post(URL, data)
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 300000)
            timer3 = setTimeout(() => {
                relayPin.writeSync(1)
                relayState = true
                const data = {
                    token: TOKEN,
                    user: USER,
                    title: TITLE,
                    message: `Warning: 3 => Turning Off`,
                    priority: 1,
                    // priority: 2,
                    // expire: 3600,
                    // retry: 20
                }
                axios.post(URL, data)
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 600000)
        }
        console.log('PIR: Triggered')
    }
})

process.on('SIGINT', () => {
    IrPin.unexport()
    PirPin.unexport()
    relayPin.unexport()
    process.exit()
});

console.log('Monitoring Sensors')