const { app } = require('electron');
app.whenReady().then(() => {
  console.log('USER_DATA_PATH:', app.getPath('userData'));
  app.quit();
});
