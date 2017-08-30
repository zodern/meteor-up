function httpGetAsyncStarForks()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var data = JSON.parse(xmlHttp.responseText);
            document.getElementById("star-hook").innerHTML = data.stargazers_count;
            document.getElementById("fork-hook").innerHTML = data.forks_count;                        
        }            
    }
    xmlHttp.open("GET", "https://api.github.com/repos/zodern/meteor-up", true); // true for asynchronous 
    xmlHttp.send(null);
}

function httpGetAsyncCommits()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var data = JSON.parse(xmlHttp.responseText);   
            var count = 0;
            data.forEach(function(element) {
                count += element.total;
            }, this);         
            document.getElementById("commit-hook").innerHTML = count;
            document.getElementById("contributor-hook").innerHTML = data.length;
        }            
    }
    xmlHttp.open("GET", "https://api.github.com/repos/zodern/meteor-up/stats/contributors", true); // true for asynchronous 
    xmlHttp.send(null);
}

httpGetAsyncStarForks();
httpGetAsyncCommits();