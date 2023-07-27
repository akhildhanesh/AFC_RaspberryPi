import axios from 'axios'
import { Gpio } from 'onoff'
import * as dotenv from 'dotenv'

dotenv.config() // for using .env files

const URL = 'https://afcd.cloud/api/messages.json' // Server URL
const TITLE = 'AFC' // Pushover Notification Title

const UID = process.env.UID // Unique product ID

const IrPin = new Gpio(4, 'in', 'both')
const PirPin = new Gpio(27, 'in', 'both')
const relayPin = new Gpio(6, 'out')

let IR = false // Will be true if IR Sensor detect something in front of it
let PIR = false // Will be true if IR sensor detect something and No One is there in the kitchen
let timer1 = {}
let timer2 = {}
let timer3 = {}
let relayState = false // Relay is turned ON or OFF

IrPin.watch((err, value) => {
    if (err) throw err

    if (value) {
        IR = true //object infront of IR
        console.log('IR: Object detected!')
    } else {
        IR = false //No object 
        if (relayState) {
            relayPin.writeSync(0) //No Object in front of IR -> So, relay OFF
        }
        relayState = false // relay is OFF
        console.log('IR: No object detected.')
    }
})

PirPin.watch((err, value) => {
    if (err) throw err

    if (value) { //If movement detected
        if (PIR) { // if timers was created -> clear all the timer (since someone is there)
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            PIR = false // PIR last state was changed back to false -> No movement Detected
        }
        console.log('PIR: Movement Detected');
    } else { //If No One is there (No Movement Detected)
        if (IR) { // and something is there in front of the IR sensor
            PIR = true // then change the state of PIR to true indicating No One is there and IR is active
            timer1 = setTimeout(() => {
                const data = {
                    key: UID,
                    title: TITLE,
                    message: `Warning: 1`
                }
                axios.post(URL, data) // send http post request to the Server
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
                axios.post(URL, data) // send http post request to the Server
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
                axios.post(URL, data) // send http post request to the Server
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 600000)
            console.log('PIR: Triggered -> No One is there in the kitchen and something is there in front of IR Sensor')
        }
    }
})

process.on('SIGINT', () => {
    IrPin.unexport()
    PirPin.unexport()
    relayPin.unexport()
    process.exit()
});

console.log('Monitoring Sensors')