const socket = io()
// elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = document.querySelector('#messageInput')
const $messageFormButton = document.querySelector("#submitButton")
const $locationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const urlTemplate = document.querySelector('#urlTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
  }
}


socket.on('message', (message)=>{
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})


socket.on('locationMessage', (locationObj)=>{
  const html = Mustache.render(urlTemplate, {
    username: locationObj.username,
    url: locationObj.url,
    createdAt: moment(locationObj.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)

  autoscroll()

})

socket.on('roomData', ({ room, users })=>{
  console.log(users)
  console.log(room)

  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html

})


socket.emit('join', {username, room}, (error)=>{
  if(error){
    alert(error)
    location.href = '/'
  }
})


$locationButton.addEventListener('click', ()=>{
  if(!navigator.geolocation){
    return alert('Geolocation is not supported by your browser')
  }

  $locationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position)=>{
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, ()=>{
      console.log('location shared')
      $locationButton.removeAttribute('disabled', 'disabled')
    })
  })
})

$messageForm.addEventListener('submit', (event)=>{
  event.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')

  let message = document.querySelector('#messageInput').value
  socket.emit('sendMessage', message, (error)=>{
    $messageFormButton.removeAttribute('disabled', 'disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if(error){
      return console.log(error)
    }
    console.log('message delivered')
  })
})

