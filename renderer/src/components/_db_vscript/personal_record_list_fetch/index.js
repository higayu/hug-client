const {
  fetchPersonalRecordList,
} = await require('./fetch');

module.exports = async function executePersonalRecordListFetch({
  input,
  helpers,
  config,
}) {
  return fetchPersonalRecordList({
    input,
    helpers,
    config,
  });
};
