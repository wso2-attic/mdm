

    config = require('/config/publisher.json'),
    carbon = require('carbon'),

    conf = carbon.server.loadConfig('carbon.xml'),
    offset = conf.*::['Ports'].*::['Offset'].text(),
    hostName = conf.*::['HostName'].text().toString();



    if (hostName === null || hostName === '') {
        hostName = 'localhost';
    }

    var httpPort = 9763 + parseInt(offset, 10);
    var httpsPort = 9443 + parseInt(offset, 10);


    var process = require('process');
    process.setProperty('server.host', hostName);
    process.setProperty('http.port', httpPort.toString());
    process.setProperty('https.port', httpsPort.toString());

    var pubConfig = require('/config/publisher.js').config();
    var server = require('/modules/server.js');
    server.init(pubConfig);

    var user = require('/modules/user.js');
    user.init(pubConfig);

    var publisher = require('/modules/publisher.js');
    publisher.init(pubConfig);

    //Configure Caramel
    caramel.configs({
        context: '/publisher',
        cache: true,
        negotiation: true,
        themer: function () {
        //TODO: Hardcoded theme
        return 'default';
    }

});



