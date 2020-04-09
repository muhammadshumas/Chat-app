const socket=io() //allows two way connection on the client side i.e,send and recieve events

const messageForm=document.querySelector('#message-form')
const messageFormInput=messageForm.querySelector('input')
const messageFormBtn=messageForm.querySelector('button')
const sendLocation=document.querySelector('#send-location')
const messages=document.querySelector('#messages')
const sidebar=document.querySelector('#sidebar')

//templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector("#location-message-template").innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
//we are getting an object containing all of our query paramters as key value pairs
const{username,room}= Qs.parse(location.search,{ignoreQueryPrefix:true}) //to remove the question mark}) //location.search contains our query parameters  in a single string which we are parsing using qs library

const autoScroll=()=>{
    // new message element
    const newMessage=messages.lastElementChild;
    //Height of the new message
    const newMessageStyles=getComputedStyle(newMessage) //returns an object containing the values of all CSS properties of an element
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=newMessage.offsetHeight + newMessageMargin //this height includes padding and border as well and we are adding margin to it aswell

    // Visible Height
    const visibleHeight=messages.offsetHeight //gives height which is currently visible to us.This is also the scrollbar height

    //Height of messages container
    const containerHeight=messages.scrollHeight

    //how far have i scrolled
    const scrollOffset=messages.scrollTop +visibleHeight //gives current scroll position we add visible height ot it because scrollTop only gives us position till the upperpart of scrollbar
    
    if(containerHeight-newMessageHeight<=scrollOffset){
        messages.scrollTop=messages.scrollHeight
    }
}

// let incrementBtn=document.querySelector('#increment')

// socket.on('countUpdated',(count)=>{ //recieving countUpdated event emitted(sent) from server and data we reviced from the server
//     console.log('the Count has been updated',count)
// })

// incrementBtn.addEventListener('click',()=>{
//     socket.emit('increment') //emitting an event from client side
// })

// socket.on('message',(message)=>{
//     console.log(message)
// })

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    messageFormBtn.setAttribute('disabled','disabled')
    message=e.target.message.value
    socket.emit('sendMessage',message,(error)=>{ //the last argument of this socket.emit which is a callback is called event acknowledgement and is executed when the reciever of this event(server in this case) successfully recieves the event
        messageFormBtn.removeAttribute('disabled')
        e.target.reset()
        messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered')
    })
    
})
socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    
    // messages.insertAdjacentElement('beforeend',html) //not working due to unknown reasons
    messages.innerHTML+=html
    autoScroll()
})

socket.on('locationMessage',(locationMessage)=>{
    console.log('location Message',locationMessage)
    const html=Mustache.render(locationMessageTemplate,{
        username:locationMessage.username,
        locationMessage:locationMessage.url,
        createdAt:moment(locationMessage.createdAt).format('h:mm a')
    })
    messages.innerHTML+=html
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    sidebar.innerHTML=html
})

sendLocation.addEventListener('click',function(){   
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    this.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        const coordinates={
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        }
        socket.emit('sendLocation',coordinates,()=>{
            console.log('Location Shared')
            this.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room},(error)=>{ //werare getting username and room from location.search(query params up above)
    if(error){
        alert(error)
        location.href='/'
    }
})