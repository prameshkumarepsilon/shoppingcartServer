const jsonServer = require('json-server')
const bodyParser = require('body-parser');
const server = jsonServer.create();
const router = jsonServer.router(require('./db.js')());
const middlewares = jsonServer.defaults();
const port = process.env.PORT;

const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'ASD2738ASDASD';

server.use(bodyParser.json());

const ADMIN_URL = path.join(__dirname, 'data/customers.json');

// middleware for all incoming requests to handle CORS
server.use((req, resp, next) => {
    resp.set('Access-Control-Allow-Origin', '*');
    resp.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT');
    resp.set('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization');
    next();
});

// a handler function for POST requests for the urls
server.options('/*', (req, resp) => {
    resp.end();
});


const verifyUser = (email, password) => {
    data = fs.readFileSync(ADMIN_URL, 'utf-8');
    data = JSON.parse(data);

    const index = data.findIndex(c => c.email === email && c.password === password);

    if (index === -1) {
        return false;
    }
    else {
        return data[index];
    }
}

server.post('/login', (req, resp) => {
    let { email, password } = req.body;
    let user = verifyUser(email, password);

    if (user) {
        let { id, name } = user;
        let token = jwt.sign({ id, name }, SECRET_KEY);
        resp.json({ id, name, token });
        return;
    }
    resp.status(401).json('Invalid email/password');
});


server.post('/customers', (req, resp, next) => {

    fs.readFile(ADMIN_URL, 'utf-8', (err, data) => {
        if (err) {
            data = '[]';
        }
        data = JSON.parse(data);
        console.log("", data)

        let maxId = data.reduce((acc, cust) => acc > cust.id ? acc : cust.id, 0);

        req.body['id'] = maxId + 1;
        next();

        data.push({ ...req.body });

        fs.writeFile(ADMIN_URL, JSON.stringify(data), 'utf-8', (err, doc) => {
            if (err) {
                throw err;
            }
            resp.json(resp.body);
        });
    });

});



server.use(middlewares)
server.use(router)
server.listen(port, () => console.log(`server started\nVisit http://localhost:${port}/`));