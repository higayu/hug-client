// main/parts/handlers/laravelAuthHandler/tempNotes/index.js

const fetch = require('./fetch');
const save = require('./save');

module.exports = {
  getHandler: fetch.handler,
  saveAllHandler: save.saveAllHandler,
  saveMemo1Handler: save.saveMemo1Handler,
  saveMemo2Handler: save.saveMemo2Handler,
};