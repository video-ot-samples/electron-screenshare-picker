const OT = require('@opentok/client');

// Set Credentials
const apiKey = '';
const sessionId = '';
const token = ''; 

if (!apiKey || !sessionId || !token) {
  alert('You need to add your apiKey, sessionId and token to openTok.js');
  return
}

// electron capturer
const { desktopCapturer } = require('electron');

var console = require('electron-log');

var session;
var publisher;

initializeSession();

connectToSession();

loadSources();

function initializeSession(){
  console.log('initializeSession');
  session = OT.initSession(apiKey, sessionId);
  session.on({
    streamCreated: (event) => {
    let subscriber = session.subscribe(event.stream, 'subscriber', (error) => {
      if (error) {
        console.error(`There was an issue subscribing to the stream: ${error}`);
      }
      else {    
        console.log("subscriber to stream " + subscriber.streamId + " ok");
      }
    });
    },
    streamDestroyed: (event) => {
      console.log(`Stream with name ${event.stream.name} ended because of reason: ${event.reason}`);
    },
    sessionConnected: function () {
      console.log('session connected');   
    }
  });
}

function connectToSession(){

  console.log('connectToSession');
  session.connect(token, (error) => {
    console.log('nside');
    if (error) {
      console.error(`There was an error connecting to session: ${error}`);
      publisher.destroy();
      return;
    } else {
      console.log('Connected to session successfully');
    }
  });
}

function loadSources() {
  console.info('loadSources');
  try {
  OT.checkScreenSharingCapability(function(response) {
	console.info(response);
  if(!response.supported || response.extensionRegistered === false) {
    // This browser does not support screen sharing.
  } else if (response.extensionInstalled === false) {
    // Prompt to install the extension.
  } else {
      desktopCapturer.getSources({ types: ['window', 'screen', 'application', 'browser'] }).then(async sources => {
        console.info('source length -'+ sources.length);        
        var selectPicture = document.querySelector('#source');
          selectPicture.name = "source";
          selectPicture.id = "source";
          let windowArr=[];
          let screenArr=[];
          let appArr=[];
          let browserArr=[];
        for (let source of sources) {
          console.log("Name: " + source.name +","+ source.id);         
          if(source.id.startsWith("window")){                        
            windowArr.push(source);            
          }else if(source.id.startsWith("screen")){             
            screenArr.push(source);            
          }else if(source.id.startsWith("application")){            
            appArr.push(source);            
          }else if(source.id.startsWith("browser")){            
            browserArr.push(source);            
          }          
        }
        windowArr.length > 0 ? addSource("Window", windowArr) : console.log('no window found');
        screenArr.length > 0 ? addSource("Screen", screenArr) : console.log('no screen found');
        appArr.length > 0 ? addSource("Application", appArr) : console.log('no application found');
        browserArr.length > 0 ? addSource("Browser", browserArr) : console.log('no browser found');
    });    
  }
  }); 
  }catch (e) {
    console.error("Error in loadSources(): ", e);
  }
}

function addSource(label, arr){
  console.info('addSource - '+ label +','+ arr.length);
  var selectPicture = document.querySelector('#source');
  var optionGrp = document.querySelector('selectPicture[data-value="'+label+'"]');
  if(typeof (optionGrp) == 'undefined' || optionGrp == null){
    console.info('no '+ label +' exists');   
      optionGrp = document.createElement('OPTGROUP'); 
      optionGrp.label = label;      
  }
  for(i=0; i< arr.length; i++){
    console.info('addSource - iterate arr- '+arr[i].name);
    var option = document.createElement('OPTION');  
    option.value = arr[i].id;
    option.text = arr[i].name;   
    option.innerHTML = arr[i].name;   
    optionGrp.appendChild(option);
  }
  selectPicture.appendChild(optionGrp);  
}

document.querySelector('#sharescreen').addEventListener('click', () => {
  console.log('what is being done - '+ document.querySelector('#sharescreen').value);
  if(document.querySelector('#sharescreen').value == "Start ScreenShare"){
    initSSPublisher();
  }else if(document.querySelector('#sharescreen').value == "Stop ScreenShare"){
    endSSPublisher();
  }else{
    console.error("wrong button name");
    return
  }
});

async function initSSPublisher() {
  var selectPicture = document.querySelector('#source');
  var desktop_id = selectPicture.options[selectPicture.selectedIndex].value;
  console.log('initSSPublisher - ' +desktop_id);

  document.querySelector('#source').disabled = true;
  document.querySelector('#sharescreen').value = "Stop ScreenShare";

    if (!desktop_id) {
      console.log('Desktop Capture access rejected.');
      return;
    }
    desktopSharing = true;
    document.querySelector('#sharescreen').value = "Stop ScreenShare";
    console.log("Desktop sharing started.. desktop_id - " + desktop_id);
    try {		    
      console.info('source - '+ desktop_id);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: desktop_id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        }
      });

      const videoTrack = stream.getVideoTracks()[0];
      publisher = OT.initPublisher({videoSource: videoTrack, audioSource: null}, function(err) {
        if (err) {
          console.error('initSSPublisher() - init publisher error', err);
        }
      });

      session.publish(publisher).on("streamCreated", function(event) {
        console.log("Publisher started streaming");

      });
    } catch (e) {
      console.error('initSSPublisher() exception-->', e);
    }
}

function endSSPublisher(){
  console.log('endSSPublisher');
  document.querySelector('#source').disabled = false;
  document.querySelector('#sharescreen').value = "Start ScreenShare";
  session.unpublish(publisher);    
}