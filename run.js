import axios from 'axios'
import { Gpio } from 'onoff'
import * as dotenv from 'dotenv'
import rpio from 'rpio'

dotenv.config() // for using .env files

const URL = 'https://afcd.cloud/api/messages.json' // Server URL
const TITLE = 'AFC' // Pushover Notification Title

const UID = process.env.UID // Unique product ID

const BuzzerPin = new Gpio(27, 'out')
const relayPin = new Gpio(6, 'out')

const triggerPin = 11
const echoPin = 15

rpio.init({ gpiomem: false })
rpio.open(triggerPin, rpio.OUTPUT, rpio.LOW)
rpio.open(echoPin, rpio.INPUT)


const measureDistance = () => {
    console.log('from measure: 1')

    rpio.write(triggerPin, rpio.HIGH)
    rpio.usleep(10)
    rpio.write(triggerPin, rpio.LOW)

    console.log('from measure: 2')

    console.log('echo Pin', rpio.read(echoPin))

    return 50

    while (rpio.read(echoPin) === 0) { }
    console.log('after')
    const start = process.hrtime.bigint()

    while (rpio.read(echoPin) === 1) { }
    const end = process.hrtime.bigint()

    console.log('from measure: 3')


    const pulseDuration = end - start
    const distance = Number(pulseDuration) / 29.412 / 2 // in cm

    return distance
}

const personDetected = () => measureDistance() < 100

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    console.log('Monitoring Sensors')
    console.log('ultrasonic: ', measureDistance(), personDetected())
    let timer1, timer2, timer3
    let timerState = false
    while (true) {
        await sleep(1000)
        if (personDetected()) {
            if (timerState) {
                clearTimeout(timer1)
                clearTimeout(timer2)
                clearTimeout(timer3)
                timerState = false
                BuzzerPin.writeSync(0)
                console.log('Timers: Stopped')
            }
        } else {
            if (timerState) continue
            timerState = true
            console.log('Timers: Started')
            timer1 = setTimeout(() => {
                BuzzerPin.writeSync(1)
                console.log('Buzzer: ON')
            }, 30000)
            timer2 = setTimeout(() => {
                const data = {
                    key: UID,
                    title: TITLE,
                    message: `Warning => ......`,
                    priority: 1
                }
                axios.post(URL, data) 
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 60000)
            timer3 = setTimeout(() => {
                relayPin.writeSync(1)
                BuzzerPin.writeSync(0)
                const data = {
                    key: UID,
                    title: TITLE,
                    message: `OFF`,
                    priority: 1,
                }
                axios.post(URL, data) 
                    .then(res => res.data)
                    .then(data => console.log(data))
                    .catch(e => console.error(e.message))
            }, 90000)
        }
    }
}

main()
.catch(err => console.error(`Error: ${err}`))