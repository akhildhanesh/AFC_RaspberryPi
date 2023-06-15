import axios from 'axios'
import { Gpio } from 'onoff'
import * as dotenv from 'dotenv'

dotenv.config()

const URL = 'https://localhost:3000/api/messages.json'
const TITLE = 'Node.js Alert'

const UID = process.env.UID

const IrPin = new Gpio(4, 'in', 'both')
const PirPin = new Gpio(27, 'in', 'both')
const relayPin = new Gpio(6, 'out')

let IR = false
let PIR = false
let timer1 = {}
let timer2 = {}
let timer3 = {}
let relayState = false

IrPin.watch((err, value) => {
    if (err) throw err

    if (value) {
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

    if (value) {
        if (PIR) {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            PIR = false
        }
        console.log('PIR: Movement Detected');
    } else {
        if (IR) {
            PIR = true
            timer1 = setTimeout(() => {
                const data = {
                    key: UID,
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
                    key: UID,
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
                    key: UID,
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