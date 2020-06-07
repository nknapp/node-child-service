setTimeout(() => {
  console.log('Ready')
}, 500)

let counter = 0;
setInterval(() => {
  counter++;
  console.log(`Running: ${counter}`)
}, 200)

