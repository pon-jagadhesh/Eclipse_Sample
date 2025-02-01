/**
 * 
 */
function login() {
    var name = "jaga";
    var password = "jaga";

    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log(xhr.responseText); 
            } else {
                console.log("Error: " + xhr.status);
            }
        }
    };

    xhr.open("POST","http://localhost:8080/SampleServlet/sample");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("name=" + name + "&password=" +password);
}