const socket = io("/");
console.log("Socket.IO connection established successfully!");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main_chat_window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "8080",
});

let myVideoStream;
let currentUserId;
let pendingMsg = 0;
let peers = {};

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "me");

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        console.log(peers);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    /*socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });*/
  });

peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
};

const addVideoStream = (videoEl, stream, uId) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const startScreenShare = () => {
  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then((stream) => {
      const screenVideo = document.createElement("video");
      addVideoStream(screenVideo, stream);

      // Broadcast screen sharing to other users
      peers[currentUserId].call(currentUserId, stream);

      // Listen for new users joining and share screen with them
      peer.on('call', (call) => {
        call.answer(stream);
      });
    })
    .catch((error) => {
      console.error('Error accessing screen sharing:', error);
    });
};

// Add an event listener to trigger screen sharing
document.getElementById('startScreenShareButton').addEventListener('click', startScreenShare);
document.getElementById("sendMsg").addEventListener("click", () => {
  const message = chatInputBox.value.trim(); // Trim removes leading and trailing whitespaces
  console.log("Message to be sent:", message);
  if (message !== "") {
    socket.emit("message", message);
    chatInputBox.value = "";
  }
});


socket.on('createMessage', (data) => {
  console.log("Received message:", data);

  const li = document.createElement("li");
  li.innerHTML = `<b>User:</b> ${data}`;
  document.getElementById("all_messages").appendChild(li);

  document.getElementById("main__chat__window").scrollTop = document.getElementById("main__chat__window").scrollHeight;
});
socket.on('createMessage', (data) => {
  console.log("Received message:", data);

  // ... (existing code)
});
document.addEventListener('DOMContentLoaded', function () {
  // Your existing script.js code here
});

// ... (existing code)

socket.on('users-list', (users) => {
  console.log('Users list:', users);
  users.forEach((user) => {
    if (user !== currentUserId) {
      // Call each user to establish video connection
      connectToNewUser(user, myVideoStream);
    }
  });
});

// ... (existing code)

document.getElementById('inviteButton').addEventListener('click', function () {
  // Get the current room ID
  const roomId = document.getElementById('roomId').innerText;

  // Fetch the invite link from the server
  fetch(`/generate-invite-link/${roomId}`)
    .then(response => response.json())
    .then(data => {
      // Display the invite link
      const inviteLink = data.inviteLink;
      alert(`Invite your friends using this link:\n${inviteLink}`);
    })
    .catch(error => console.error('Error:', error));
});




