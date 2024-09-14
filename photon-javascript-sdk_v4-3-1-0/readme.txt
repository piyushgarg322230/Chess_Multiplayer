Photon JavaScript SDK

(C) Exit Games GmbH 2024


Overview 
----------------------------------------------------------------------------------------------------
The Photon Javascript library provides a simple to use framework to access the Photon Server and the Photon Cloud.
Cross platform communication is possible, so Javascript clients can interact with DotNet or native clients.
The SDK supports 2 APIs.


Realtime (LoadBalancing) API
----------------------------------------------------------------------------------------------------
Allows to access Photon Cloud Realtime service: https://doc.photonengine.com/en-us/realtime/current/getting-started/realtime-intro


Chat API
----------------------------------------------------------------------------------------------------
Allows to access Photon Chat service: https://doc.photonengine.com/en-us/chat/current/getting-started/chat-intro


Documentation
----------------------------------------------------------------------------------------------------
The reference documentation is in this package. Follow links per API above for more documentation for Photon development.


Download
----------------------------------------------------------------------------------------------------
The latest version of Javascript SDK can be found at https://www.photonengine.com/sdks#realtime-sdkrealtimejavascript


Installation
----------------------------------------------------------------------------------------------------
- Extract the Photon Javascript SDK to a location of your choice

- Create an application in https://dashboard.photonengine.com/
  Use Chat application type for demo-chat-api and Realtime for other demos.
- Set up you application info with a text editor in cloud-app-info.js file found in the demo root folder.
- Optionally for demo-particle and demo-pairs-mc samples, set FbAppId to your Facebook App id 
  in cloud-app-info.js for Facebook login. Place your HTML5 / JavaScript client code on one of 
  App Domains specified in your Facebook App settings. This required for proper Facebook Login 
  button work.
- Open default.html in browser.


Contact
----------------------------------------------------------------------------------------------------
To get in touch with other Photon developers and our engineers, Join our Discord Server https://dashboard.photonengine.com/account/profile
Keep yourself up to date following Exit Games on Twitter http://twitter.com/exitgames and our blog http://blog.photonengine.com


Package Contents
----------------------------------------------------------------------------------------------------
- license.txt         - the license terms
- readme.txt          - readme text
- release_history.txt - release history
- /doc                - the JavaScript API reference documentation
- /lib                - Photon JavaScript libraries
  -  /photon.js              - Photon Realtime library
  -  /photon.min.js          - minimized version
  -  /photon-em.js           - Photon Realtime Emscripten library (binary protocol)
  -  /photon-em.min.js       - minimized version
  -  /photon.d.ts            - Photon Realtime Typescript declaration file
- /src    
  -  /demo-loadbalancing     - basic Realtime (LoadBalancing) API demo application
  -  /demo-particle          - demo showing more of the Realtime API's features
  -  /demo-pairs-mc          - Turnbased Realtime application demo
  -  /demo-chat-api          - Chat API demo application
