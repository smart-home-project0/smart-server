
function notifyDeviceStatusChanged(wss, device_id, deviceStatus) {
  if (wss && wss.clients) {
    const payload = JSON.stringify({
      type: "deviceStatusChanged",
      device_id,
      status: deviceStatus
    });
    console.log(`[WebSocket] שולח עדכון לסטטוס מכשיר: device_id=${device_id}, status=${deviceStatus}, כמות קליינטים: ${wss.clients.size}`);
    wss.clients.forEach((client, idx) => {
      if (client.readyState === 1) { // 1 = OPEN
        try {
          client.send(payload);
          console.log(`[WebSocket] הודעה נשלחה לקליינט ${idx + 1}`);
        } catch (err) {
          console.error(`[WebSocket] שגיאה בשליחת הודעה לקליינט ${idx + 1}:`, err);
        }
      } else {
        console.log(`[WebSocket] קליינט ${idx + 1} לא במצב OPEN (מצב: ${client.readyState})`);
      }
    });
  } else {
    console.log("[WebSocket] אין מופע wss או שאין קליינטים מחוברים");
  }
}
export{notifyDeviceStatusChanged}