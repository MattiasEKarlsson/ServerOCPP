
const bcrypt = require ('bcrypt');
const saltRounds = 10;
// INIT WebsocketServer
const WebSocket = require('ws');
const fetch = require("node-fetch");
const Port = 80;
const Divider = '------------------------'

const wsServer = new WebSocket.Server({
   port: Port
});

console.log((new Date()) + " Server is listening on port "+ Port)
console.log('Waiting for clients to connect..')

//Hämtar JSON meddelande.
const start = require("./RequestStartTransaction.json")
const startTransaction = JSON.stringify(start);

const responsJSON = require("./BootNotification.json");
const respond = JSON.stringify(responsJSON);

const _unlockconJSON = require("./UnlockConnector.json");
const _unlockcon = JSON.stringify(_unlockconJSON);



// Handeling requests from Clients.
wsServer.on('connection', function (socket, req) {

    console.log('A client just connected\n' +Divider );

    socket.on('message', function(msg) {
        
        
        let parsedMsg = JSON.parse(msg);
        console.log(parsedMsg);
        console.log(Divider)

        switch(parsedMsg[2]){
            case'BootNotification':

            let station = new chargingStation(
                parsedMsg[3].chargingStation.serialNumber,
                 parsedMsg[3].chargingStation.model,
                  parsedMsg[3].chargingStation.vendorName,
                   parsedMsg[3].chargingStation.firmwareVersion);
            
            station.available = "true";
            _ip = req.socket.remoteAddress.split(":");
            station.ip = _ip[3]
            station.port = req.socket.remotePort.toString();
            
            checkExisting(station);

            console.log('Its a BootNotification\n' +Divider);
            console.log(station);
            console.log(Divider)
            socket.send(respond)
            break;

            case'Heartbeat':

            let hb = new heartbeat();
            ip = req.socket.remoteAddress.split(":");
            hb.ip = ip;
            
            
            
            PostHeartBeat(ip[3])


            console.log('Its a Hearthbeat!!\n' +Divider);
            //socket.send(startTransaction)
            //socket.send(_unlockcon);
            
            break;

            case'StatusNotification':
            console.log("Status " + parsedMsg[3].connectorStatus)
            break;

            case'TransactionEvent':
            if(parsedMsg[3].eventType=='Started'){
                console.log('Påbörja laddning\n' +Divider);
            }
            if(parsedMsg[3].eventType=='Ended'){
                console.log('Avslutar laddning\n' +Divider);
            }
            break;
            
            case'Authorize':

            (async () => {
                var key = parsedMsg[3].idToken.idToken
                let response = await checkTag(key);
                if(response==true){
                    console.log("Access Granted!!")
            
                    var responseaa = JSON.stringify([3,parsedMsg[1], {
                        "status": "Accepted"
                    }]);
                    socket.send(responseaa)
                }
                else{
                    console.log("Access DENIED!!")
                    var responseaa = JSON.stringify([3,parsedMsg[1], {
                        "status": "Rejected"
                    }]);
                    socket.send(responseaa)
                }
              })();
            break;

        };
          //Startar laddning från annan klient.
         if(parsedMsg==1){
             wsServer.clients.forEach(function(client){
                 console.log('Skickar ut Start charging\n' +Divider);
              client.send(startTransaction)
            })
         };
    });

    //
    socket.onclose = function(event) {
        console.log('A client disconnected.\n' +Divider);
      };
    
});

async function checkExisting(CS) {
    let response = await fetch('https://ocppapi.azurewebsites.net/api/CheckChargingStation/' +CS.serialNumber);
    console.log(CS.serialNumber)
    console.log(Divider)
    
    let data = await response.json();

    if(data == true){
        console.log('Serialnumber hittades\n' +Divider);
    }

    if(data == false){
        console.log('Skapar ny stolpe i DB\n' +Divider);
        PostChargingStation(CS);
    }    

}

async function PostChargingStation(CS){
    fetch('https://ocppapi.azurewebsites.net/api/ChargingStations', {
    method: 'POST',
    body: JSON.stringify(CS),
    headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
    .then(json => console.log(json));

}

async function PostHeartBeat(HB){
    fetch('https://ocppapi.azurewebsites.net/api/Heartbeats/' +HB, {
    method: 'POST'});
    console.log('HB posted')
    console.log(HB)

}


async function checkTag(key) {
    let response = await fetch('https://ocppapi.azurewebsites.net/api/CheckUser/' +key).then(res => res.json());
    return response
}

class chargingStation {
    constructor(serialNumber, model, vendorName, firmwareVersion) {
        this.serialNumber = serialNumber;
        this.model = model;
        this.vendorName = vendorName;
        this.firmwareVersion = firmwareVersion;
    }
}

class heartbeat{

    constructor(ip, created){

        this.ip = ip;
        this.created = created;
    }

}












 //wsServer.clients.forEach(function(client){
        //client.send(respond)
       //})



