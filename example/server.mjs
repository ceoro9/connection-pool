import { createServer } from 'net';

const server = createServer(function (socket) {
    console.log('new connection');
    socket.write('goodbye');
    socket.on('data', function (data) {
        console.log("Data received: " + data.toString());
    });
    socket.on('end', () => console.log('close connecction'));
});

server.on('error', function (err) {
    throw err;
});

server.listen({
    host: 'localhost',
    port: 8000,
    exclusive: true
});
