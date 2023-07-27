const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    console.log('Monitoring Sensors')
    let timer1, timer2, timer3
    let timerState = true
    setTimeout(() => {
        console.log('fff')
        timerState = false
    }, 3000)
    while (true) {
        console.log('yesss')
        await sleep(1000)
        if (timerState) continue
    }
}

main()
    .catch(err => console.error(`Error: ${err}`))