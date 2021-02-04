(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', event => {
    let connectButton = document.querySelector("#connect");
    let statusDisplay = document.querySelector('#status');
    let terminalElement = document.getElementById("terminal");
    let port;

    function connect() {
      port.connect().then(() => {
        statusDisplay.textContent = '';
        connectButton.textContent = 'Disconnect';

        port.onReceive = data => {
          let textDecoder = new TextDecoder();
	  let decodedText = textDecoder.decode(data);
          terminalElement.innerText += decodedText;
          terminalElement.scrollTop = terminalElement.scrollHeight;
        };
        port.onReceiveError = error => {
          console.error(error);
        };
      }, error => {
        statusDisplay.textContent = error;
      });
    }

    connectButton.addEventListener('click', function() {
      if (port) {
        port.disconnect();
        connectButton.textContent = 'Connect';
        statusDisplay.textContent = '';
        port = null;
      } else {
        serial.requestPort().then(selectedPort => {
          port = selectedPort;
          connect();
        }).catch(error => {
          statusDisplay.textContent = error;
        });
      }
    });

    document.getElementById('ctrla').addEventListener('click', function () {
        if (port) port.send(new Uint8Array([1]));
    });
    document.getElementById('ctrlb').addEventListener('click', function () {
        if (port) port.send(new Uint8Array([2]));
    });
    document.getElementById('ctrlc').addEventListener('click', function () {
        if (port) port.send(new Uint8Array([3]));
    });
    document.getElementById('ctrld').addEventListener('click', function () {
        if (port) port.send(new Uint8Array([4]));
    });
    document.getElementById('ctrle').addEventListener('click', function () {
        if (port) port.send(new Uint8Array([5]));
    });

    document.getElementById('choose-file').onchange = e => {
	var file = e.target.files[0];
        var reader = new FileReader();
	reader.readAsText(file, "utf-8");
	reader.onload = readerEvent => {
	    var content = readerEvent.target.result;
	    console.log(content);
	    port.send(new TextEncoder('utf-8').encode("\x03\x03\x01\x04_fh = open('/" + file.name + "', 'wb')\x04"));
	    for (var i=0; i<content.length; i+=50) {
		var cmd = "_fh.write(bytes([";
		for (var j=0; j<50; j++) {
		    cmd += content.charCodeAt(i*50+j) + ",";
		}
		cmd += "]))\x04";
	        port.send(new TextEncoder('utf-8').encode(cmd));
	    }
	    port.send(new TextEncoder('utf-8').encode('_fh.flush()\x04'));
	    port.send(new TextEncoder('utf-8').encode('_fh.close()\x04\x02\x03\x03\x04'));
	}
    }

    serial.getPorts().then(ports => {
      if (ports.length === 0) {
        statusDisplay.textContent = 'No device found.';
      } else {
        statusDisplay.textContent = 'Connecting...';
        port = ports[0];
        connect();
      }
    });

    document.addEventListener("keypress", function(event) {
      port.send(new TextEncoder('utf-8').encode(String.fromCharCode(event.which || event.keyCode)));
    });

    document.addEventListener("paste", function(event) {
      port.send(new TextEncoder('utf-8').encode("\x05" + event.clipboardData.getData('text/plain') + "\x04"));
    });

  });
})();
