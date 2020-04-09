const path=require('path')
const http=require('http') //core module
const express=require('express') // instance of express
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app) //express library does this behind the scenes but we are doing it explictly
                                    // to configure sockets

const io=socketio(server) //socket io expects this socketio() function to be called with raw server thats why
                         // we have done manual server configuration above

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public') //__dirname refers to the current folder

app.use(express.static(publicDirectoryPath))


// let count=0

io.on('connection',(socket)=>{  // connection is an event here which is fired when ever a client is connected to the socketio server.If there are five clients then it will run 5 times
    console.log('new websocket connection')
    // socket.emit('countUpdated',count) //is used to send data to the client,Here we are emitting a custom event and sending count as our data.Here we are using socket.emit and not io.emit because if we do se every time a new connection is made all the users will recieve this event and we dont want this we want this only when a client connects
    // socket.on('increment',()=>{
    //     count++
    //     // socket.emit('countUpdated',count) //when we use socket.emit() we only emit it to one client and thats a problem.
    //     io.emit('countUpdated',count) // this will emit countUpdated to every client
    // })
    
    // socket.emit('message',generateMessage('Welcome!'))
    // socket.broadcast.emit('message',generateMessage('A new user has joined !')) //when we add broadcast then it means that this event will be sent to everyone except the one who has just joined
    socket.on('join',(options,callback)=>{
        const {error,user}= addUser({id:socket.id,...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined !`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        }) 
        callback()
    })
    socket.on('sendMessage',(message,callback)=>{
        const filter=new Filter() //instance of bad-words library
        if(filter.isProfane(message)){ //is profane checks if the argument passed to it contains any bad words or not.It returns a boolean
            return callback('Profanity is not allowed')
        }

        const user=getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()//this callback is used for event acknowledgement and is defined on client side here we are executing it
    })

    socket.on('sendLocation',(coordinates,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        console.log(user)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`)) // we are not using broadcast here since the user has already left and will never get the messages
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    }) //we dont need to emit connection or disconnect event from the client since they are built-in events
})

server.listen(port,()=>{ //instead of app.listen() we are using server.listen now as we have configured it above
	console.log("server is up on port "+port)
})