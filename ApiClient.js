const BASE_URL = "http://game.com";
const RIDERCT_BASE_URL = "https://mybackend.com/api";

class ApiClient {

  static callMatchStartApi(data, callback) {
    let matchID = "1725517395151";
    let player1ID = data.isHostUser ? "Player_1" : "Player_102";
    let player2ID = data.isHostUser ? "Player_102" : "Player_1";

    if(data.isBot){
      player2ID = "b99"
    }
    const url = BASE_URL+'?token=secret&returnURL=mybackend.com/api&matchId='+matchID+'&player1Id='+player1ID+'&player2Id='+player2ID;

    fetch(url, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "priority": "u=0, i",
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        'Content-Type': 'application/x-www-form-urlencoded' // Ensure the content type is allowed
      },
      "method": "GET",
      "mode": "no-cors",
      "credentials": "omit"
    })
        .then(response => {
            if (!response.ok) {
              return;
               // throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Assuming the API returns JSON
        })
        .then(data => {
            console.log('Success:', data);
            callback(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            // Handle the error in your game here
        });






  }
  static callMatchEndRiderectApi(data, callback) {
    const url = BASE_URL; // Ensure this is set to the correct API URL

    fetch(url, {
      "method": "POST", // Use POST to send data
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "priority": "u=0, i",
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        'Content-Type': 'application/x-www-form-urlencoded' // Ensure the content type is allowed
      },
      "body": new URLSearchParams(data).toString(), // Convert data object to URL-encoded format
      "mode": "no-cors",
      "credentials": "omit"
    })
    .then(response => {
        if (!response.ok) {
          return;
           // throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json(); // Parse JSON response
    })
    .then(responseData => {
        console.log('Success:', responseData);
        callback(responseData); // Pass data to the callback
    })
    .catch(error => {
        console.error('Fetch operation failed:', error);
        // Handle error here
    });
}
}

