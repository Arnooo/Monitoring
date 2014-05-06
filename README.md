Monitoring
==========

A simple angular client and node server to manage probes/sensors.

INSTALL
-------

1- Make sure NodeJS is installed on your computer

    node -v
    
If not, go to: http://howtonode.org/how-to-install-nodejs

2- Install node-monitoring in node_modules/, create it in the "Monitoring/server/" directory if needed.

    cd [YOUR DIR]/Monitoring/server/
    mkdir node_modules
    
3- Install the module using: 

    npm install node-monitoring
    
4- Launch your mysql server

    mysql.server start
    
5- Launch node server

    cd [YOUR DIR]/Monitoring/app/
    node ../server/web-server.js
            
6- Go to "http://localhost:8000/index.html" to open the Monitoring Application

7- Configure your access to the database

8- Here we go, you can add probes/sensors and check value in realtime

TEST
----

VERSION
------
Release: 0.1.0
